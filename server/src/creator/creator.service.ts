import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { AlbumFeaturedAuthorModel } from 'src/album-featured-author/model/album-featured-author.model';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { mapAlbumModel } from 'src/album/album.mapper';
import {
  AuthorApplicationModel,
  AuthorApplicationStatus,
} from 'src/author-application/model/author-application.model';
import { AuthorModel } from 'src/author/model/author.model';
import { FileService, FileType } from 'src/file/file.service';
import { GenreModel } from 'src/genre/model/genre.model';
import { TrackFeaturedAuthorModel } from 'src/track-featured-author/model/track-featured-author.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { TrackModel } from 'src/track/model/track.model';
import { UserModel } from 'src/user/model/user.model';
import { RbacService } from 'src/rbac/rbac.service';
import { mapTrackModel } from 'src/track/track.mapper';
import { TokenService } from 'src/token/token.service';
import * as bcrypt from 'bcrypt';
import { CreatorApplicationDto } from './dto/creator-application.dto';
import {
  CreateCreatorAlbumDto,
  CreateCreatorTrackDto,
  UpdateCreatorAlbumDto,
  UpdateCreatorTrackDto,
} from './dto/creator-catalog.dto';
import {
  DeleteCreatorProfileDto,
  UpdateCreatorProfileDto,
} from './dto/creator-profile.dto';

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const audioMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
]);

@Injectable()
export class CreatorService {
  private readonly logger = new Logger(CreatorService.name);

  constructor(
    @InjectModel(AuthorApplicationModel)
    private readonly applicationRepository: typeof AuthorApplicationModel,
    @InjectModel(AuthorModel)
    private readonly authorRepository: typeof AuthorModel,
    @InjectModel(UserModel) private readonly userRepository: typeof UserModel,
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
    @InjectModel(GenreModel)
    private readonly genreRepository: typeof GenreModel,
    @InjectModel(TrackGenreModel)
    private readonly trackGenreRepository: typeof TrackGenreModel,
    @InjectModel(AlbumTrackModel)
    private readonly albumTrackRepository: typeof AlbumTrackModel,
    @InjectModel(TrackFeaturedAuthorModel)
    private readonly trackFeaturedAuthorRepository: typeof TrackFeaturedAuthorModel,
    @InjectModel(AlbumFeaturedAuthorModel)
    private readonly albumFeaturedAuthorRepository: typeof AlbumFeaturedAuthorModel,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly fileService: FileService,
    private readonly rbacService: RbacService,
    private readonly tokenService: TokenService,
  ) {}

  private assertFile(
    file: Express.Multer.File | undefined,
    kind: 'avatar' | 'image' | 'audio',
  ): asserts file is Express.Multer.File {
    if (!file) throw new BadRequestException(`${kind} file is required`);
    const maxBytes =
      kind === 'avatar'
        ? 2 * 1024 * 1024
        : kind === 'image'
          ? 5 * 1024 * 1024
          : 50 * 1024 * 1024;
    const allowed = kind === 'audio' ? audioMimeTypes : imageMimeTypes;
    if (!allowed.has(file.mimetype) || file.size > maxBytes)
      throw new BadRequestException(`Invalid ${kind} file`);
  }

  private async getOwnedAuthor(
    userId: number,
    transaction?: Transaction,
  ): Promise<AuthorModel> {
    const author = await this.authorRepository.findOne({
      where: { userId },
      transaction,
    });
    if (!author) throw new ForbiddenException('Author approval is required');
    return author;
  }

  private async assertFeaturedAuthors(
    authorId: number,
    ids: number[] | undefined,
    transaction: Transaction,
  ) {
    const uniqueIds = [...new Set(ids ?? [])];
    if (uniqueIds.includes(authorId))
      throw new BadRequestException('Primary author cannot be featured');
    if (!uniqueIds.length) return uniqueIds;
    const count = await this.authorRepository.count({
      where: { id: { [Op.in]: uniqueIds } },
      transaction,
    });
    if (count !== uniqueIds.length)
      throw new NotFoundException(
        'One or more featured authors were not found',
      );
    return uniqueIds;
  }

  private async assertGenres(ids: number[], transaction: Transaction) {
    const uniqueIds = [...new Set(ids)];
    const count = await this.genreRepository.count({
      where: { id: { [Op.in]: uniqueIds } },
      transaction,
    });
    if (count !== uniqueIds.length)
      throw new NotFoundException('One or more genres were not found');
    return uniqueIds;
  }

  private normalizeIdempotencyKey(key?: string): string | undefined {
    if (!key) return undefined;
    const normalized = key.trim().toLowerCase();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        normalized,
      )
    ) {
      throw new BadRequestException('Idempotency-Key must be a valid UUID');
    }
    return normalized;
  }

  private async assignTracksToAlbum(
    author: AuthorModel,
    albumId: number,
    trackIds: number[],
    transaction: Transaction,
  ) {
    const album = await this.albumRepository.findByPk(albumId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!album) throw new NotFoundException('Album not found');
    if (album.authorId !== author.id)
      throw new ForbiddenException('Album does not belong to author');

    const uniqueTrackIds = [...new Set(trackIds)];
    const tracks = await this.trackRepository.findAll({
      where: { id: { [Op.in]: uniqueTrackIds } },
      attributes: ['id', 'authorId'],
      transaction,
    });
    if (tracks.length !== uniqueTrackIds.length)
      throw new NotFoundException('One or more tracks were not found');
    if (tracks.some((track) => track.authorId !== author.id))
      throw new ForbiddenException('Track does not belong to author');

    const existing = await this.albumTrackRepository.findAll({
      where: { albumId, trackId: { [Op.in]: uniqueTrackIds } },
      attributes: ['trackId'],
      transaction,
    });
    const existingIds = new Set(existing.map((relation) => relation.trackId));
    const missingIds = uniqueTrackIds.filter((id) => !existingIds.has(id));
    if (missingIds.length) {
      const currentMax = await this.albumTrackRepository.max('position', {
        where: { albumId },
        transaction,
      });
      const firstPosition =
        currentMax === null || currentMax === undefined
          ? 0
          : Number(currentMax) + 1;
      await this.albumTrackRepository.bulkCreate(
        missingIds.map((trackId, index) => ({
          albumId,
          trackId,
          position: firstPosition + index,
        })),
        { transaction },
      );
    }
    return { albumId, addedTrackIds: missingIds, trackIds: uniqueTrackIds };
  }

  async getMe(userId: number) {
    const [author, application] = await Promise.all([
      this.authorRepository.findOne({ where: { userId } }),
      this.applicationRepository.findOne({ where: { userId } }),
    ]);
    if (author && application?.status !== 'rejected') {
      const [tracks, albums] = await Promise.all([
        this.trackRepository.count({ where: { authorId: author.id } }),
        this.albumRepository.count({ where: { authorId: author.id } }),
      ]);
      return { state: 'approved' as const, author, counts: { tracks, albums } };
    }
    if (!application) return { state: 'none' as const };
    return {
      state: application.status as Exclude<AuthorApplicationStatus, 'approved'>,
      application,
      ...(author ? { author } : {}),
    };
  }

  async updateProfile(
    userId: number,
    dto: UpdateCreatorProfileDto,
    avatar?: Express.Multer.File,
  ) {
    if (!dto.stageName && !dto.bio && !avatar)
      throw new BadRequestException('At least one profile field is required');
    if (avatar) this.assertFile(avatar, 'avatar');

    let nextAvatar: string | undefined;
    let previousPaths: Array<string | null | undefined> = [];
    try {
      if (avatar)
        nextAvatar = this.fileService.createFile(FileType.IMAGE, avatar);
      previousPaths = await this.sequelize.transaction(async (transaction) => {
        const author = await this.getOwnedAuthor(userId, transaction);
        const application = await this.applicationRepository.findOne({
          where: { userId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        const previous = [
          nextAvatar ? author.avatar : undefined,
          nextAvatar ? application?.avatar : undefined,
        ];
        const values = {
          ...(dto.stageName !== undefined
            ? { name: dto.stageName.trim() }
            : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio.trim() } : {}),
          ...(nextAvatar ? { avatar: nextAvatar } : {}),
        };
        await author.update(values, { transaction });
        if (application?.status === 'approved')
          await application.update(
            {
              ...(dto.stageName !== undefined
                ? { stageName: dto.stageName.trim() }
                : {}),
              ...(dto.bio !== undefined ? { bio: dto.bio.trim() } : {}),
              ...(nextAvatar ? { avatar: nextAvatar } : {}),
            },
            { transaction },
          );
        return previous;
      });
    } catch (error) {
      if (nextAvatar) this.deleteFilesBestEffort([nextAvatar]);
      throw error;
    }
    this.deleteFilesBestEffort([
      ...new Set(previousPaths.filter((path) => path !== nextAvatar)),
    ]);
    return this.getMe(userId);
  }

  async deleteProfile(userId: number, dto: DeleteCreatorProfileDto) {
    const result = await this.sequelize.transaction(async (transaction) => {
      const user = await this.userRepository.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user || !(await bcrypt.compare(dto.currentPassword, user.password)))
        throw new UnauthorizedException('Current password is incorrect');

      const author = await this.authorRepository.findOne({
        where: { userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!author) throw new NotFoundException('Author profile not found');
      if (dto.stageName.trim() !== author.name)
        throw new BadRequestException('Stage name does not match');

      const [tracks, albums, application] = await Promise.all([
        this.trackRepository.findAll({
          where: { authorId: author.id },
          attributes: ['id', 'picture', 'audio'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        }),
        this.albumRepository.findAll({
          where: { authorId: author.id },
          attributes: ['id', 'picture'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        }),
        this.applicationRepository.findOne({
          where: { userId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        }),
      ]);

      const deletedTracks = await this.trackRepository.destroy({
        where: { authorId: author.id },
        transaction,
      });
      const deletedAlbums = await this.albumRepository.destroy({
        where: { authorId: author.id },
        transaction,
      });
      if (deletedTracks !== tracks.length || deletedAlbums !== albums.length)
        throw new ConflictException('Author catalog changed during deletion');

      if (application) await application.destroy({ transaction });
      await author.destroy({ transaction });
      await this.rbacService.removeSystemRole(userId, 'author', transaction);

      return {
        authorId: author.id,
        paths: [
          author.avatar,
          application?.avatar,
          ...tracks.flatMap((track) => [track.picture, track.audio]),
          ...albums.map((album) => album.picture),
        ],
      };
    });

    this.deleteFilesBestEffort([...new Set(result.paths)]);
    return { deleted: true, authorId: result.authorId };
  }

  async submitApplication(
    userId: number,
    dto: CreatorApplicationDto,
    avatar?: Express.Multer.File,
  ) {
    if (avatar) this.assertFile(avatar, 'avatar');

    let nextAvatar: string | undefined;
    try {
      if (avatar)
        nextAvatar = this.fileService.createFile(FileType.IMAGE, avatar);
      const { application, previousAvatar } = await this.sequelize.transaction(
        async (transaction) => {
          if (
            await this.authorRepository.findOne({
              where: { userId },
              transaction,
              lock: transaction.LOCK.UPDATE,
            })
          )
            throw new ConflictException('Author profile already exists');
          const existing = await this.applicationRepository.findOne({
            where: { userId },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (existing?.status === 'pending')
            throw new ConflictException('Application is already pending');
          if (!existing && !nextAvatar)
            throw new BadRequestException('avatar file is required');
          if (!existing) {
            const application = await this.applicationRepository.create(
              {
                userId,
                stageName: dto.stageName.trim(),
                bio: dto.bio.trim(),
                avatar: nextAvatar!,
                status: 'pending',
                reviewNote: null,
                reviewedBy: null,
                reviewedAt: null,
              },
              { transaction },
            );
            return { application, previousAvatar: undefined };
          }
          const previousAvatar = existing.avatar;
          await existing.update(
            {
              stageName: dto.stageName.trim(),
              bio: dto.bio.trim(),
              avatar: nextAvatar ?? existing.avatar,
              status: 'pending',
              reviewNote: null,
              reviewedBy: null,
              reviewedAt: null,
            },
            { transaction },
          );
          return { application: existing, previousAvatar };
        },
      );
      if (nextAvatar && previousAvatar && previousAvatar !== nextAvatar)
        this.fileService.deleteFile(previousAvatar);
      return application;
    } catch (error) {
      if (nextAvatar) this.fileService.deleteFile(nextAvatar);
      throw error;
    }
  }

  async getApplications(
    status: AuthorApplicationStatus | undefined,
    count: number,
    offset: number,
  ) {
    const where = status ? { status } : undefined;
    const { rows, count: total } =
      await this.applicationRepository.findAndCountAll({
        where,
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'email', 'displayName'],
          },
        ],
        order: [['updatedAt', 'DESC']],
        limit: count,
        offset,
      });
    return { items: rows, total };
  }

  async approve(applicationId: number, reviewerId: number) {
    return this.sequelize.transaction(async (transaction) => {
      const application = await this.applicationRepository.findByPk(
        applicationId,
        { transaction, lock: transaction.LOCK.UPDATE },
      );
      if (!application) throw new NotFoundException('Application not found');
      if (!['pending', 'rejected'].includes(application.status))
        throw new ConflictException('Application has already been reviewed');
      let author = await this.authorRepository.findOne({
        where: { userId: application.userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (author) {
        await author.update(
          {
            name: application.stageName,
            bio: application.bio,
            avatar: application.avatar,
          },
          { transaction },
        );
      } else {
        author = await this.authorRepository.create(
          {
            userId: application.userId,
            name: application.stageName,
            bio: application.bio,
            avatar: application.avatar,
          },
          { transaction },
        );
      }
      const user = await this.userRepository.findByPk(application.userId, {
        transaction,
      });
      if (!user) throw new NotFoundException('Application user not found');
      await this.rbacService.assignSystemRole(user.id, 'author', transaction);
      await application.update(
        {
          status: 'approved',
          reviewNote: null,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
        { transaction },
      );
      return { application, author };
    });
  }

  async reject(applicationId: number, reviewerId: number, reviewNote: string) {
    return this.sequelize.transaction(async (transaction) => {
      const application = await this.applicationRepository.findByPk(
        applicationId,
        { transaction, lock: transaction.LOCK.UPDATE },
      );
      if (!application) throw new NotFoundException('Application not found');
      if (!['pending', 'approved'].includes(application.status))
        throw new ConflictException('Application has already been reviewed');
      const user = await this.userRepository.findByPk(application.userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) throw new NotFoundException('Application user not found');
      if (application.status === 'approved') {
        await this.rbacService.removeSystemRole(user.id, 'author', transaction);
        user.sessionVersion += 1;
        await user.save({ transaction });
        await this.tokenService.removeAllForUser(user.id, transaction);
      }
      return application.update(
        {
          status: 'rejected',
          reviewNote: reviewNote.trim(),
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
        { transaction },
      );
    });
  }

  async getTracks(
    userId: number,
    count: number,
    offset: number,
    query?: string,
  ) {
    const author = await this.getOwnedAuthor(userId);
    const where = {
      authorId: author.id,
      ...(query ? { name: { [Op.iLike]: `%${query}%` } } : {}),
    };
    const [page, total] = await Promise.all([
      this.trackRepository.findAll({
        where,
        attributes: ['id'],
        order: [['id', 'DESC']],
        limit: count,
        offset,
      }),
      this.trackRepository.count({ where }),
    ]);
    const ids = page.map((track) => track.id);
    if (!ids.length) return { items: [], total };
    const rows = await this.trackRepository.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: AlbumModel,
          as: 'albums',
          attributes: ['id', 'name'],
          through: { attributes: ['position'] },
          required: false,
        },
      ],
      order: [['id', 'DESC']],
    });
    const byId = new Map(rows.map((track) => [track.id, mapTrackModel(track)]));
    return {
      items: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
      total,
    };
  }

  async getAlbums(
    userId: number,
    count: number,
    offset: number,
    query?: string,
  ) {
    const author = await this.getOwnedAuthor(userId);
    const where = {
      authorId: author.id,
      ...(query ? { name: { [Op.iLike]: `%${query}%` } } : {}),
    };
    const [page, total] = await Promise.all([
      this.albumRepository.findAll({
        where,
        attributes: ['id'],
        order: [['id', 'DESC']],
        limit: count,
        offset,
      }),
      this.albumRepository.count({ where }),
    ]);
    const ids = page.map((album) => album.id);
    if (!ids.length) return { items: [], total };
    const rows = await this.albumRepository.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
      ],
      order: [['id', 'DESC']],
    });
    const byId = new Map(rows.map((model) => [model.id, mapAlbumModel(model)]));
    return {
      items: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
      total,
    };
  }

  async createAlbum(
    userId: number,
    dto: CreateCreatorAlbumDto,
    picture?: Express.Multer.File,
    idempotencyKey?: string,
  ) {
    const creatorRequestId = this.normalizeIdempotencyKey(idempotencyKey);
    if (creatorRequestId) {
      const author = await this.getOwnedAuthor(userId);
      const existing = await this.albumRepository.findOne({
        where: { authorId: author.id, creatorRequestId },
      });
      if (existing) return existing;
    }
    this.assertFile(picture, 'image');
    let picturePath: string | undefined;
    let createdNew = false;
    try {
      picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      const result = await this.sequelize.transaction(async (transaction) => {
        const author = await this.getOwnedAuthor(userId, transaction);
        if (creatorRequestId) {
          const existing = await this.albumRepository.findOne({
            where: { authorId: author.id, creatorRequestId },
            transaction,
          });
          if (existing) return existing;
        }
        const featuredAuthorIds = await this.assertFeaturedAuthors(
          author.id,
          dto.featuredAuthorIds,
          transaction,
        );
        const album = await this.albumRepository.create(
          {
            name: dto.name.trim(),
            picture: picturePath!,
            listens: 0,
            authorId: author.id,
            creatorRequestId: creatorRequestId ?? null,
          },
          { transaction },
        );
        createdNew = true;
        if (featuredAuthorIds.length)
          await this.albumFeaturedAuthorRepository.bulkCreate(
            featuredAuthorIds.map((authorId, position) => ({
              albumId: album.id,
              authorId,
              position,
            })),
            { transaction },
          );
        return album;
      });
      if (!createdNew && picturePath) this.fileService.deleteFile(picturePath);
      return result;
    } catch (error) {
      if (picturePath) this.fileService.deleteFile(picturePath);
      throw error;
    }
  }

  async createTrack(
    userId: number,
    dto: CreateCreatorTrackDto,
    picture?: Express.Multer.File,
    audio?: Express.Multer.File,
    idempotencyKey?: string,
  ) {
    const creatorRequestId = this.normalizeIdempotencyKey(idempotencyKey);
    if (creatorRequestId) {
      const author = await this.getOwnedAuthor(userId);
      const existing = await this.trackRepository.findOne({
        where: { authorId: author.id, creatorRequestId },
      });
      if (existing) return existing;
    }
    this.assertFile(picture, 'image');
    this.assertFile(audio, 'audio');
    let picturePath: string | undefined;
    let audioPath: string | undefined;
    let createdNew = false;
    try {
      picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      audioPath = this.fileService.createFile(FileType.AUDIO, audio);
      const result = await this.sequelize.transaction(async (transaction) => {
        const author = await this.getOwnedAuthor(userId, transaction);
        if (creatorRequestId) {
          const existing = await this.trackRepository.findOne({
            where: { authorId: author.id, creatorRequestId },
            transaction,
          });
          if (existing) return existing;
        }
        const [genreIds, featuredAuthorIds] = await Promise.all([
          this.assertGenres(dto.genreIds, transaction),
          this.assertFeaturedAuthors(
            author.id,
            dto.featuredAuthorIds,
            transaction,
          ),
        ]);
        const albumIds = [
          ...new Set([
            ...(dto.albumIds ?? []),
            ...(dto.albumId ? [dto.albumId] : []),
          ]),
        ];
        const track = await this.trackRepository.create(
          {
            name: dto.name.trim(),
            text: dto.text?.trim() ?? '',
            picture: picturePath!,
            audio: audioPath!,
            listens: 0,
            authorId: author.id,
            creatorRequestId: creatorRequestId ?? null,
          },
          { transaction },
        );
        createdNew = true;
        await this.trackGenreRepository.bulkCreate(
          genreIds.map((genreId) => ({ trackId: track.id, genreId })),
          { transaction },
        );
        for (const albumId of albumIds) {
          await this.assignTracksToAlbum(
            author,
            albumId,
            [track.id],
            transaction,
          );
        }
        if (featuredAuthorIds.length)
          await this.trackFeaturedAuthorRepository.bulkCreate(
            featuredAuthorIds.map((authorId, position) => ({
              trackId: track.id,
              authorId,
              position,
            })),
            { transaction },
          );
        return track;
      });
      if (!createdNew) {
        if (picturePath) this.fileService.deleteFile(picturePath);
        if (audioPath) this.fileService.deleteFile(audioPath);
      }
      return result;
    } catch (error) {
      if (picturePath) this.fileService.deleteFile(picturePath);
      if (audioPath) this.fileService.deleteFile(audioPath);
      throw error;
    }
  }

  async assignAlbumTracks(userId: number, albumId: number, trackIds: number[]) {
    return this.sequelize.transaction(async (transaction) => {
      const author = await this.getOwnedAuthor(userId, transaction);
      return this.assignTracksToAlbum(author, albumId, trackIds, transaction);
    });
  }

  async getTrack(userId: number, trackId: number) {
    const author = await this.getOwnedAuthor(userId);
    const track = await this.trackRepository.findOne({
      where: { id: trackId, authorId: author.id },
      include: [
        { model: AuthorModel, as: 'author' },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: AlbumModel,
          as: 'albums',
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: GenreModel,
          as: 'genres',
          through: { attributes: [] },
          required: false,
        },
      ],
    });
    if (!track) throw new NotFoundException('Track not found');
    return mapTrackModel(track);
  }

  async getAlbum(userId: number, albumId: number) {
    const author = await this.getOwnedAuthor(userId);
    const album = await this.albumRepository.findOne({
      where: { id: albumId, authorId: author.id },
      include: [
        { model: AuthorModel, as: 'author' },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: TrackModel,
          as: 'tracks',
          through: { attributes: ['position'] },
          required: false,
        },
      ],
    });
    if (!album) throw new NotFoundException('Album not found');
    return mapAlbumModel(album);
  }

  async deleteTracks(userId: number, trackIds: number[]) {
    const ids = [...trackIds];
    const files = await this.sequelize.transaction(async (transaction) => {
      const author = await this.getOwnedAuthor(userId, transaction);
      const tracks = await this.trackRepository.findAll({
        where: { id: { [Op.in]: ids }, authorId: author.id },
        attributes: ['id', 'picture', 'audio'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (tracks.length !== ids.length)
        throw new NotFoundException('One or more tracks were not found');

      const deleted = await this.trackRepository.destroy({
        where: { id: { [Op.in]: ids }, authorId: author.id },
        transaction,
      });
      if (deleted !== ids.length)
        throw new ConflictException('Tracks changed during deletion');

      const byId = new Map(tracks.map((track) => [track.id, track]));
      return ids.flatMap((id) => {
        const track = byId.get(id);
        return track ? [track.picture, track.audio] : [];
      });
    });

    this.deleteFilesBestEffort(files);
    return { deletedIds: ids };
  }

  async deleteAlbums(userId: number, albumIds: number[]) {
    const ids = [...albumIds];
    const files = await this.sequelize.transaction(async (transaction) => {
      const author = await this.getOwnedAuthor(userId, transaction);
      const albums = await this.albumRepository.findAll({
        where: { id: { [Op.in]: ids }, authorId: author.id },
        attributes: ['id', 'picture'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (albums.length !== ids.length)
        throw new NotFoundException('One or more albums were not found');

      const deleted = await this.albumRepository.destroy({
        where: { id: { [Op.in]: ids }, authorId: author.id },
        transaction,
      });
      if (deleted !== ids.length)
        throw new ConflictException('Albums changed during deletion');

      const byId = new Map(albums.map((album) => [album.id, album]));
      return ids.flatMap((id) => {
        const album = byId.get(id);
        return album ? [album.picture] : [];
      });
    });

    this.deleteFilesBestEffort(files);
    return { deletedIds: ids };
  }

  private deleteFilesBestEffort(paths: Array<string | null | undefined>) {
    for (const path of paths) {
      if (!path) continue;
      try {
        this.fileService.deleteFile(path);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Release deleted, but file cleanup failed: ${reason}`);
      }
    }
  }

  async updateTrack(
    userId: number,
    trackId: number,
    dto: UpdateCreatorTrackDto,
    picture?: Express.Multer.File,
    audio?: Express.Multer.File,
  ) {
    if (picture) this.assertFile(picture, 'image');
    if (audio) this.assertFile(audio, 'audio');
    let nextPicture: string | undefined;
    let nextAudio: string | undefined;
    try {
      if (picture)
        nextPicture = this.fileService.createFile(FileType.IMAGE, picture);
      if (audio) nextAudio = this.fileService.createFile(FileType.AUDIO, audio);
      const removed = await this.sequelize.transaction(async (transaction) => {
        const author = await this.getOwnedAuthor(userId, transaction);
        const track = await this.trackRepository.findOne({
          where: { id: trackId, authorId: author.id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!track) throw new NotFoundException('Track not found');
        if (dto.genreIds !== undefined)
          await this.assertGenres(dto.genreIds, transaction);
        const featured =
          dto.featuredAuthorIds !== undefined
            ? await this.assertFeaturedAuthors(
                author.id,
                dto.featuredAuthorIds,
                transaction,
              )
            : undefined;
        if (dto.albumIds !== undefined)
          await this.assignTracksToAlbums(
            author,
            dto.albumIds,
            [track.id],
            transaction,
            true,
          );
        const old = {
          picture: nextPicture ? track.picture : undefined,
          audio: nextAudio ? track.audio : undefined,
        };
        await track.update(
          {
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.text !== undefined ? { text: dto.text } : {}),
            ...(nextPicture ? { picture: nextPicture } : {}),
            ...(nextAudio ? { audio: nextAudio } : {}),
          },
          { transaction },
        );
        if (dto.genreIds !== undefined) {
          await this.trackGenreRepository.destroy({
            where: { trackId: track.id },
            transaction,
          });
          await this.trackGenreRepository.bulkCreate(
            dto.genreIds.map((genreId) => ({ trackId: track.id, genreId })),
            { transaction },
          );
        }
        if (featured !== undefined) {
          await this.trackFeaturedAuthorRepository.destroy({
            where: { trackId: track.id },
            transaction,
          });
          if (featured.length)
            await this.trackFeaturedAuthorRepository.bulkCreate(
              featured.map((authorId, position) => ({
                trackId: track.id,
                authorId,
                position,
              })),
              { transaction },
            );
        }
        return old;
      });
      if (removed.picture) this.fileService.deleteFile(removed.picture);
      if (removed.audio) this.fileService.deleteFile(removed.audio);
      return this.getTrack(userId, trackId);
    } catch (error) {
      if (nextPicture) this.fileService.deleteFile(nextPicture);
      if (nextAudio) this.fileService.deleteFile(nextAudio);
      throw error;
    }
  }

  async updateAlbum(
    userId: number,
    albumId: number,
    dto: UpdateCreatorAlbumDto,
    picture?: Express.Multer.File,
  ) {
    if (picture) this.assertFile(picture, 'image');
    let nextPicture: string | undefined;
    try {
      if (picture)
        nextPicture = this.fileService.createFile(FileType.IMAGE, picture);
      const oldPicture = await this.sequelize.transaction(
        async (transaction) => {
          const author = await this.getOwnedAuthor(userId, transaction);
          const album = await this.albumRepository.findOne({
            where: { id: albumId, authorId: author.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (!album) throw new NotFoundException('Album not found');
          const featured =
            dto.featuredAuthorIds !== undefined
              ? await this.assertFeaturedAuthors(
                  author.id,
                  dto.featuredAuthorIds,
                  transaction,
                )
              : undefined;
          const old = nextPicture ? album.picture : undefined;
          await album.update(
            {
              ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
              ...(nextPicture ? { picture: nextPicture } : {}),
            },
            { transaction },
          );
          if (featured !== undefined) {
            await this.albumFeaturedAuthorRepository.destroy({
              where: { albumId },
              transaction,
            });
            if (featured.length)
              await this.albumFeaturedAuthorRepository.bulkCreate(
                featured.map((authorId, position) => ({
                  albumId,
                  authorId,
                  position,
                })),
                { transaction },
              );
          }
          return old;
        },
      );
      if (oldPicture) this.fileService.deleteFile(oldPicture);
      return this.getAlbum(userId, albumId);
    } catch (error) {
      if (nextPicture) this.fileService.deleteFile(nextPicture);
      throw error;
    }
  }

  async replaceAlbumComposition(
    userId: number,
    albumId: number,
    trackIds: number[],
  ) {
    return this.sequelize.transaction(async (transaction) => {
      const author = await this.getOwnedAuthor(userId, transaction);
      const album = await this.albumRepository.findOne({
        where: { id: albumId, authorId: author.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!album) throw new NotFoundException('Album not found');
      const unique = [...new Set(trackIds)];
      if (unique.length) {
        const tracks = await this.trackRepository.findAll({
          where: { id: { [Op.in]: unique } },
          attributes: ['id', 'authorId'],
          transaction,
        });
        if (tracks.length !== unique.length)
          throw new NotFoundException('One or more tracks were not found');
        if (tracks.some((track) => track.authorId !== author.id))
          throw new ForbiddenException('Track does not belong to author');
      }
      await this.albumTrackRepository.destroy({
        where: { albumId },
        transaction,
      });
      if (unique.length)
        await this.albumTrackRepository.bulkCreate(
          unique.map((trackId, position) => ({ albumId, trackId, position })),
          { transaction },
        );
      return { albumId, trackIds: unique };
    });
  }

  private async assignTracksToAlbums(
    author: AuthorModel,
    albumIds: number[],
    trackIds: number[],
    transaction: Transaction,
    replace: boolean,
  ) {
    const uniqueAlbumIds = [...new Set(albumIds)];
    const albums = await this.albumRepository.findAll({
      where: { id: { [Op.in]: uniqueAlbumIds }, authorId: author.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (albums.length !== uniqueAlbumIds.length)
      throw new ForbiddenException(
        'One or more albums do not belong to author',
      );
    if (replace)
      await this.albumTrackRepository.destroy({
        where: { trackId: { [Op.in]: trackIds } },
        transaction,
      });
    for (const albumId of uniqueAlbumIds)
      await this.assignTracksToAlbum(author, albumId, trackIds, transaction);
  }
}
