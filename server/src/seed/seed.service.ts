import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import tracks from './data/track-seed';
import albums from './data/album-seed';
import album_tracks from './data/album_track-seed';
import { UserModel } from 'src/user/model/user.model';
import users from './data/user-seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(TrackModel) private trackModel: typeof TrackModel,
    @InjectModel(AlbumModel) private albumModel: typeof AlbumModel,
    @InjectModel(UserModel) private userModel: typeof UserModel,
    @InjectModel(AlbumTrackModel)
    private albumTrackModel: typeof AlbumTrackModel,
  ) {}

  private async autoInsert(model: any, seedData: object[]) {
    const count = await model.count();
    if (count === 0) {
      await model.bulkCreate(seedData);
      console.log(`✅ Данные добавлены в ${model.name}`);
    }
  }

  // Функция для запуска всех сидов
  async seed() {
    await this.autoInsert(this.trackModel, tracks);
    await this.autoInsert(this.albumModel, albums);
    await this.autoInsert(this.albumTrackModel, album_tracks);
    await this.autoInsert(this.userModel, users);
    console.log('✅ Все сиды успешно добавлены!');
  }
}
