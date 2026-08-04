import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistModel } from './model/playlist.model';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectModel(PlaylistModel)
    private readonly playlistRepository: typeof PlaylistModel,
  ) {}

  create(
    dto: CreatePlaylistDto,
    owner: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    return this.playlistRepository.create({ ...dto, userId: owner.sub });
  }

  getAll(
    owner: AccessTokenPayload,
    count = 10,
    offset = 0,
  ): Promise<PlaylistModel[]> {
    return this.playlistRepository.findAll({
      where: owner.role === 'admin' ? undefined : { userId: owner.sub },
      limit: count,
      offset,
    });
  }

  async getOne(
    id: number,
    requester: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    const playlist = await this.playlistRepository.findByPk(id, {
      subQuery: false,
      include: [
        {
          model: TrackModel,
          through: { attributes: [] },
          attributes: {
            include: [
              [Sequelize.literal('"tracks->author"."name"'), 'authorName'],
              [Sequelize.literal('"tracks->albums"."id"'), 'albumId'],
            ],
          },
          include: [
            { model: AuthorModel, attributes: [] },
            { model: AlbumModel, attributes: [], through: { attributes: [] } },
          ],
        },
      ],
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    this.assertOwner(playlist, requester);
    return playlist;
  }

  async delete(id: number, requester: AccessTokenPayload): Promise<void> {
    const playlist = await this.getOne(id, requester);
    await playlist.destroy();
  }

  async change(
    id: number,
    dto: UpdatePlaylistDto,
    requester: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    const playlist = await this.getOne(id, requester);
    Object.assign(playlist, dto);
    return playlist.save();
  }

  private assertOwner(
    playlist: PlaylistModel,
    requester: AccessTokenPayload,
  ): void {
    if (requester.role !== 'admin' && playlist.userId !== requester.sub) {
      throw new ForbiddenException('You can only access your own playlists');
    }
  }
}
