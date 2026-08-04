import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { FileService, FileType } from 'src/file/file.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { TrackModel } from './model/track.model';

@Injectable()
export class TrackService {
  constructor(
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
    private readonly fileService: FileService,
  ) {}

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
      return await this.trackRepository.create({
        ...dto,
        listens: 0,
        audio: audioPath,
        picture: picturePath,
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
    const track = await this.trackRepository.findByPk(id);
    if (!track) throw new NotFoundException('Track not found');
    Object.assign(track, updateData);
    return track.save();
  }
}
