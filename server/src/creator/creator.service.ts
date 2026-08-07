import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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
import { CreatorApplicationDto } from './dto/creator-application.dto';
import {
  CreateCreatorAlbumDto,
  CreateCreatorTrackDto,
} from './dto/creator-catalog.dto';

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
    if (author) {
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
    };
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
      if (application.status !== 'pending')
        throw new ConflictException('Application has already been reviewed');
      if (
        await this.authorRepository.findOne({
          where: { userId: application.userId },
          transaction,
        })
      )
        throw new ConflictException('Author profile already exists');
      const author = await this.authorRepository.create(
        {
          userId: application.userId,
          name: application.stageName,
          bio: application.bio,
          avatar: application.avatar,
        },
        { transaction },
      );
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
      if (application.status !== 'pending')
        throw new ConflictException('Application has already been reviewed');
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
}
