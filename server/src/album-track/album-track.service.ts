import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreateAlbumTrackDto } from './dto/create-albumTrack.dto';
import { UpdateAlbumTrackDto } from './dto/update-albumTrack.dto';
import { AlbumTrackModel } from './model/album-track.model';

@Injectable()
export class AlbumTrackService {
  constructor(
    @InjectModel(AlbumTrackModel)
    private readonly relationRepository: typeof AlbumTrackModel,
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
  ) {}

  async create(dto: CreateAlbumTrackDto): Promise<AlbumTrackModel> {
    const relation = { albumId: dto.albumId, trackId: dto.trackId };
    if (await this.relationRepository.findOne({ where: relation }))
      throw new ConflictException('Track is already in this album');
    return this.relationRepository.create(relation);
  }

  async getOne(albumId: number): Promise<AlbumModel> {
    const album = await this.albumRepository.findByPk(albumId, {
      include: [{ model: TrackModel, through: { attributes: [] } }],
    });
    if (!album) throw new NotFoundException('Album not found');
    return album;
  }

  async delete(id: number): Promise<void> {
    if (!(await this.relationRepository.destroy({ where: { id } })))
      throw new NotFoundException('Album track relation not found');
  }

  async change(id: number, dto: UpdateAlbumTrackDto): Promise<AlbumTrackModel> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Album track relation not found');
    const albumId = dto.albumId ?? relation.albumId;
    const trackId = dto.trackId ?? relation.trackId;
    const duplicate = await this.relationRepository.findOne({
      where: { albumId, trackId },
    });
    if (duplicate && duplicate.id !== relation.id)
      throw new ConflictException('Track is already in this album');
    relation.albumId = albumId;
    relation.trackId = trackId;
    return relation.save();
  }
}
