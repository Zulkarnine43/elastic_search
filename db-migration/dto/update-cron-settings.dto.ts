import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateExportCronSettings {
    @IsNotEmpty()
    @IsNumber()
    schedule_minutes: number;
}