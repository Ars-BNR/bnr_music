import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { FileService, FileType } from 'src/file/file.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { TrackModel } from './model/track.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';

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
    return this.trackRepository.findAll({
      order: [['listens', 'DESC']],
      limit: count,
      offset,
      subQuery: false,
      attributes: {
        include: [
          [Sequelize.literal('"author"."name"'), 'authorName'],
          [Sequelize.literal('"albums"."id"'), 'albumId'],
        ],
      },
      include: [
        { model: AuthorModel, attributes: [] },
        { model: AlbumModel, attributes: [], through: { attributes: [] } },
      ],
      raw: true,
      nest: true,
    });
  }

  async getAll(count = 10, offset = 0): Promise<TrackModel[]> {
    return this.trackRepository.findAll({
      limit: count,
      offset,
      attributes: {
        include: [[Sequelize.literal('"author"."name"'), 'authorName']],
      },
      include: [{ model: AuthorModel, attributes: [] }],
    });
  }

  async getOne(id: number): Promise<TrackModel> {
    const track = await this.trackRepository.findByPk(id, {
      subQuery: false,
      attributes: {
        include: [[Sequelize.literal('"albums"."id"'), 'albumId']],
      },
      include: [
        { model: AlbumModel, attributes: [], through: { attributes: [] } },
      ],
      raw: true,
      nest: true,
    });
    if (!track) throw new NotFoundException('Track not found');
    return track;
  }

  async listen(id: number): Promise<{ listens: number }> {
    const [affected] = await this.trackRepository.increment('listens', {
      where: { id },
    });
    if (Number(affected) === 0) throw new NotFoundException('Track not found');
    const track = await this.trackRepository.findByPk(id, {
      attributes: ['id', 'listens'],
    });
    return { listens: track!.listens };
  }

  async search(query: string, page = 1, limit = 5): Promise<TrackModel[]> {
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

    return this.trackRepository.findAll({
      subQuery: false,
      include: [
        { model: AuthorModel, required: true },
        { model: AlbumModel, required: true },
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
