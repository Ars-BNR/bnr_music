import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistModel } from './model/playlist.model';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectModel(PlaylistModel)
    private readonly playlistRepository: typeof PlaylistModel,
    @InjectModel(CollectionModel)
    private readonly collectionRepository: typeof CollectionModel,
    @InjectModel(CollectionPlaylistModel)
    private readonly collectionPlaylistRepository: typeof CollectionPlaylistModel,
    @InjectModel(PlaylistTrackModel)
    private readonly playlistTrackRepository: typeof PlaylistTrackModel,
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async create(
    dto: CreatePlaylistDto,
    owner: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    return this.sequelize.transaction(async (transaction) => {
      const [collection] = await this.collectionRepository.findOrCreate({
        where: { userId: owner.sub },
        defaults: { userId: owner.sub },
        transaction,
      });
      const playlist = await this.playlistRepository.create(
        { ...dto, userId: owner.sub },
        { transaction },
      );
      await this.collectionPlaylistRepository.create(
        { collectionId: collection.id, playlistId: playlist.id },
        { transaction },
      );
      return playlist;
    });
  }

  async getMine(owner: AccessTokenPayload, count = 20, offset = 0) {
    const where = { userId: owner.sub };
    const [items, total] = await Promise.all([
      this.playlistRepository.findAll({
        where,
        order: [['id', 'DESC']],
        limit: count,
        offset,
      }),
      this.playlistRepository.count({ where }),
    ]);
    if (items.length === 0) return { items: [], total };

    const playlistIds = items.map((playlist) => playlist.id);
    const countRows = (await this.playlistTrackRepository.findAll({
      attributes: [
        'playlistId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'trackCount'],
      ],
      where: { playlistId: { [Op.in]: playlistIds } },
      group: ['playlistId'],
      raw: true,
    })) as unknown as Array<{
      playlistId: number;
      trackCount: number | string;
    }>;
    const trackCounts = new Map(
      countRows.map((row) => [Number(row.playlistId), Number(row.trackCount)]),
    );

    return {
      items: items.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        userId: playlist.userId,
        trackCount: trackCounts.get(playlist.id) ?? 0,
      })),
      total,
    };
  }

  getAll(
    owner: AccessTokenPayload,
    count = 10,
    offset = 0,
  ): Promise<PlaylistModel[]> {
    return this.playlistRepository.findAll({
      where: { userId: owner.sub },
      limit: count,
      offset,
    });
  }

  private async getOwnedPlaylist(
    id: number,
    requester: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    const playlist = await this.playlistRepository.findByPk(id);
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userId !== requester.sub) {
      throw new ForbiddenException('You can only access your own playlists');
    }
    return playlist;
  }

  async getOne(
    id: number,
    requester: AccessTokenPayload,
    count = 20,
    offset = 0,
  ) {
    const playlist = await this.getOwnedPlaylist(id, requester);
    const [relations, total] = await Promise.all([
      this.playlistTrackRepository.findAll({
        where: { playlistId: id },
        attributes: ['trackId'],
        order: [['id', 'ASC']],
        limit: count,
        offset,
      }),
      this.playlistTrackRepository.count({ where: { playlistId: id } }),
    ]);
    const trackIds = [
      ...new Set(
        relations
          .map((relation) => relation.trackId)
          .filter((trackId): trackId is number => trackId !== undefined),
      ),
    ];
    const trackModels = trackIds.length
      ? await this.trackRepository.findAll({
          where: { id: { [Op.in]: trackIds } },
          include: [
            {
              model: AuthorModel,
              as: 'author',
              attributes: ['id', 'name', 'avatar'],
              required: true,
            },
            {
              model: AlbumModel,
              as: 'albums',
              attributes: ['id'],
              through: { attributes: [] },
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
        })
      : [];
    const tracksById = new Map(trackModels.map((track) => [track.id, track]));
    const tracks = trackIds.flatMap((trackId) => {
      const track = tracksById.get(trackId);
      if (!track) return [];
      const value = track.get({ plain: true }) as TrackModel & {
        featuredAuthors?: AuthorModel[];
      };
      return [
        {
          ...value,
          authorName: value.author?.name ?? '',
          albumId: value.albums?.[0]?.id,
          featuredAuthors:
            value.featuredAuthors?.map((author) => ({
              id: author.id,
              name: author.name,
              avatar: author.avatar ?? null,
            })) ?? [],
        },
      ];
    });
    return {
      id: playlist.id,
      name: playlist.name,
      userId: playlist.userId,
      tracks,
      total,
    };
  }

  async delete(id: number, requester: AccessTokenPayload): Promise<void> {
    const playlist = await this.getOwnedPlaylist(id, requester);
    await playlist.destroy();
  }

  async change(
    id: number,
    dto: UpdatePlaylistDto,
    requester: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    const playlist = await this.getOwnedPlaylist(id, requester);
    Object.assign(playlist, dto);
    return playlist.save();
  }

  async addTrack(id: number, trackId: number, requester: AccessTokenPayload) {
    await this.getOwnedPlaylist(id, requester);
    const track = await this.trackRepository.findByPk(trackId);
    if (!track) throw new NotFoundException('Track not found');
    const existing = await this.playlistTrackRepository.findOne({
      where: { playlistId: id, trackId },
    });
    if (existing)
      throw new ConflictException('Track is already in this playlist');
    return this.playlistTrackRepository.create({ playlistId: id, trackId });
  }

  async removeTrack(
    id: number,
    trackId: number,
    requester: AccessTokenPayload,
  ): Promise<void> {
    await this.getOwnedPlaylist(id, requester);
    const relation = await this.playlistTrackRepository.findOne({
      where: { playlistId: id, trackId },
    });
    if (!relation) throw new NotFoundException('Track is not in this playlist');
    await relation.destroy();
  }
}
