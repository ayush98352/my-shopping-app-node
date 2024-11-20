import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import Tokens = require('csrf'); // Import the Tokens class


@Controller()
export class AppController {
  private tokens: Tokens; // Declare an instance of Tokens
  constructor(private readonly appService: AppService) { this.tokens = new Tokens(); }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    res.json({ csrfToken: req.csrfToken() });
  }

  // @Get('csrf-token')
  // getCsrfToken(@Req() req: Request, @Res() res: Response) {
  //   const csrfTokenFromCookie = req.cookies['_csrf'];
  //   if (!csrfTokenFromCookie) {
  //     return res.status(400).json({ error: 'CSRF token not found in cookies' });
  //     const csrfToken = req.csrfToken();
  //   }
  //   console.log('CSRF Token from Cookie:', csrfTokenFromCookie);
  //   res.json({ csrfToken: csrfTokenFromCookie ? csrfTokenFromCookie : req.csrfToken() });
  // }

  // In a separate utility file or within the same controller file
  



  // @Get('csrf-token')
  // getCsrfToken(@Req() req: Request, @Res() res: Response) {
  //   // const secret = this.getSecret(req, 'session'); // Retrieve the secret from session or cookie
  //   const csrfTokenFromCookie = req.cookies['_csrf'];
  //   console.log('csrfTokenFromCookie', csrfTokenFromCookie)
  //   // console.log('secret', secret)
  //   const csrfToken = this.tokens.create(csrfTokenFromCookie); // Create a new token based on the secret
  //   console.log('token', csrfToken)
  //   // Optionally, set the CSRF token in a cookie
  //   res.cookie('_csrf', csrfToken, { httpOnly: true });

  //   console.log('Generated CSRF Token:', csrfToken);
  //   res.json({ csrfToken });
  // }

  // // Define the getSecret function within the same class
  // private getSecret(req: Request, sessionKey: string) {
  //   return (req as any).session?.[sessionKey] || req.cookies['_csrf'];
  // }

}
