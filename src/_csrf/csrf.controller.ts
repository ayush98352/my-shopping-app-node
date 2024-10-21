import { Controller,Body,Get,Post,HttpCode,Request, UseGuards,Response } from '@nestjs/common';


@Controller('csrf')
export class CsrfController {
  constructor() {}


 @Get()
  async getToken(@Request() req: any, @Response() res: any) {
 
    const token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token);
    res.locals.csrfToken = token;
    res.send(true);
   
  }
}
