import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { QueryTypes } from 'sequelize';
import { randomUUID } from 'crypto';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { FileService, FileType } from 'src/file/file.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { TrackModel } from './model/track.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { mapTrackModel } from './track.mapper';

@Injectable()
export class TrackService {
  constructor(
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
    @InjectModel(GenreModel)
    private readonly genreRepository: typeof GenreModel,
    @InjectModel(TrackGenreModel)
    private readonly trackGenreRepository: typeof TrackGenreModel,
    private readonly fileService: FileService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  private async assertGenreIds(
    genreIds: number[],
    transaction: Transaction,
  ): Promise<number[]> {
    const uniqueGenreIds = [...new Set(genreIds)];
    const found = await this.genreRepository.count({
      where: { id: { [Op.in]: uniqueGenreIds } },
      transaction,
    });
    if (found !== uniqueGenreIds.length) {
      throw new BadRequestException('One or more genres do not exist');
    }
    return uniqueGenreIds;
  }

  async create(
    dto: CreateTrackDto,
    picture?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): Promise<TrackModel> {
    if (!picture || !audio)
      throw new BadRequestException('Picture and audio files are required');

    let picturePath: string | undefined;
    let audioPath: string | undefined;
    try {
      picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      audioPath = this.fileService.createFile(FileType.AUDIO, audio);
      return await this.sequelize.transaction(async (transaction) => {
        const genreIds = await this.assertGenreIds(dto.genreIds, transaction);
        const trackData = {
          name: dto.name,
          authorId: dto.authorId,
          text: dto.text,
        };
        const track = await this.trackRepository.create(
          {
            ...trackData,
            listens: 0,
            audio: audioPath,
            picture: picturePath,
          },
          { transaction },
        );
        await this.trackGenreRepository.bulkCreate(
          genreIds.map((genreId) => ({ trackId: track.id, genreId })),
          { transaction },
        );
        return track;
      });
    } catch (error) {
      if (picturePath) this.fileService.deleteFile(picturePath);
      if (audioPath) this.fileService.deleteFile(audioPath);
      throw error;
    }
  }

  async getTopTracks(count = 10, offset = 0) {
    const tracks = await this.trackRepository.findAll({
      order: [['listens', 'DESC']],
      limit: count,
      offset,
      subQuery: false,
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
    });
    return tracks.map(mapTrackModel);
  }

  async getAll(count = 10, offset = 0) {
    const tracks = await this.trackRepository.findAll({
      limit: count,
      offset,
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
      subQuery: false,
    });
    return tracks.map(mapTrackModel);
  }

  async getOne(id: number) {
    const track = await this.trackRepository.findByPk(id, {
      subQuery: false,
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
    });
    if (!track) throw new NotFoundException('Track not found');
    return mapTrackModel(track);
  }

  async listen(id: number): Promise<{ listens: number }> {
    const result = await this.recordPlay(id, randomUUID());
    return { listens: result.listens };
  }

  async recordPlay(
    id: number,
    playbackId: string,
  ): Promise<{ recorded: boolean; listens: number }> {
    return this.sequelize.transaction(async (transaction) => {
      const track = await this.trackRepository.findByPk(id, {
        attributes: ['id', 'listens'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!track) throw new NotFoundException('Track not found');

      const inserted = await this.sequelize.query<{ id: string }>(
        `INSERT INTO "play_events" ("playbackId", "trackId", "playedAt")
         VALUES (:playbackId, :trackId, CURRENT_TIMESTAMP)
         ON CONFLICT ("playbackId") DO NOTHING RETURNING "id"`,
        {
          replacements: { playbackId, trackId: id },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      if (inserted.length === 0) {
        return { recorded: false, listens: track.listens };
      }

      await track.increment('listens', { by: 1, transaction });
      await track.reload({ attributes: ['id', 'listens'], transaction });
      return { recorded: true, listens: track.listens };
    });
  }

  async search(query: string, page = 1, limit = 5) {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery)
      throw new BadRequestException('Search query is required');
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException('Invalid search pagination');
    }

    const tracks = await this.trackRepository.findAll({
      subQuery: false,
      include: [
        { model: AuthorModel, as: 'author', required: true },
        {
          model: AlbumModel,
          as: 'albums',
          attributes: ['id', 'name'],
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
      ],
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${normalizedQuery}%` } },
          { '$author.name$': { [Op.iLike]: `%${normalizedQuery}%` } },
          { '$albums.name$': { [Op.iLike]: `%${normalizedQuery}%` } },
        ],
      },
      limit,
      offset: (page - 1) * limit,
    });
    return tracks.map(mapTrackModel);
  }

  async delete(id: number): Promise<void> {
    const affected = await this.trackRepository.destroy({ where: { id } });
    if (!affected) throw new NotFoundException('Track not found');
  }

  async change(id: number, updateData: UpdateTrackDto): Promise<TrackModel> {
    return this.sequelize.transaction(async (transaction) => {
      const track = await this.trackRepository.findByPk(id, { transaction });
      if (!track) throw new NotFoundException('Track not found');

      const { genreIds, ...trackData } = updateData;
      if (genreIds !== undefined) {
        const validGenreIds = await this.assertGenreIds(genreIds, transaction);
        await this.trackGenreRepository.destroy({
          where: { trackId: id },
          transaction,
        });
        await this.trackGenreRepository.bulkCreate(
          validGenreIds.map((genreId) => ({ trackId: id, genreId })),
          { transaction },
        );
      }

      Object.assign(track, trackData);
      return track.save({ transaction });
    });
  }
}
