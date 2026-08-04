import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { OwnershipService } from 'src/auth/ownership.service';
import { AuthorModel } from 'src/author/model/author.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreatePlaylistTrackDto } from './dto/create-playlistTrack.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlistTrack.dto';
import { PlaylistTrackModel } from './model/playlist-track.model';

@Injectable()
export class PlaylistTrackService {
  constructor(
    @InjectModel(PlaylistTrackModel)
    private readonly relationRepository: typeof PlaylistTrackModel,
    private readonly ownership: OwnershipService,
  ) {}

  async create(
    dto: CreatePlaylistTrackDto,
    user: AccessTokenPayload,
  ): Promise<PlaylistTrackModel> {
    await this.ownership.ensurePlaylistOwner(dto.playlistId, user);
    const relation = { playlistId: dto.playlistId, trackId: dto.trackId };
    if (await this.relationRepository.findOne({ where: relation }))
      throw new ConflictException('Track is already in this playlist');
    return this.relationRepository.create(relation);
  }

  async delete(id: number, user: AccessTokenPayload): Promise<void> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Playlist track relation not found');
    await this.ownership.ensurePlaylistOwner(relation.playlistId, user);
    await relation.destroy();
  }

  async change(
    id: number,
    dto: UpdatePlaylistTrackDto,
    user: AccessTokenPayload,
  ): Promise<PlaylistTrackModel> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Playlist track relation not found');
    await this.ownership.ensurePlaylistOwner(relation.playlistId, user);
    const playlistId = dto.playlistId ?? relation.playlistId;
    const trackId = dto.trackId ?? relation.trackId;
    await this.ownership.ensurePlaylistOwner(playlistId, user);
    const duplicate = await this.relationRepository.findOne({
      where: { playlistId, trackId },
    });
    if (duplicate && duplicate.id !== relation.id)
      throw new ConflictException('Track is already in this playlist');
    relation.playlistId = playlistId;
    relation.trackId = trackId;
    return relation.save();
  }

  async getTracksByPlaylistId(
    playlistId: number,
    user: AccessTokenPayload,
    limit = 10,
    offset = 0,
  ) {
    await this.ownership.ensurePlaylistOwner(playlistId, user);
    return this.relationRepository.findAll({
      where: { playlistId },
      attributes: [
        'id',
        'playlistId',
        'trackId',
        [Sequelize.literal('"track"."name"'), 'name'],
        [Sequelize.literal('"track"."picture"'), 'picture'],
        [Sequelize.literal('"track"."text"'), 'text'],
        [Sequelize.literal('"track"."listens"'), 'listens'],
        [Sequelize.literal('"track"."audio"'), 'audio'],
        [Sequelize.literal('"track"."authorId"'), 'authorId'],
        [Sequelize.literal('"track->author"."name"'), 'authorName'],
        [Sequelize.literal('"playlist"."name"'), 'playlistname'],
      ],
      include: [
        {
          model: TrackModel,
          attributes: [],
          include: [{ model: AuthorModel, attributes: [] }],
        },
        { model: PlaylistModel, attributes: [] },
      ],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true,
    });
  }
}
