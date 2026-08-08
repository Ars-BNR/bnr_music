import { IsUUID } from 'class-validator';

export class RecordPlayDto {
  @IsUUID('4')
  playbackId: string;
}
