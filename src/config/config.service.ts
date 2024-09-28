import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
@Injectable()
export class ConfigService {
    private readonly envConfig: { [key: string]: string };
    public errorMsg = {error:131, api_status:false, msg: "No data available."};
    constructor(filePath: string) {
        this.envConfig = dotenv.parse(fs.readFileSync(filePath));
    }

    get(key: string): string {
        return this.envConfig[key];
    }
    
}
