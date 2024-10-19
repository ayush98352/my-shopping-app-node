import { Controller, Get, HttpCode, Post , Body, Req, Query, Request} from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
    constructor(private readonly homeService: HomeService) {}

    @Get('/')
    @HttpCode(200)
    async getHome() {
        return await this.homeService.getHome();
    }

    @Get('/send-otp')
    @HttpCode(200)
    async sendOtp(@Req() request: Request) {
        // console.log('phoneNumber', phoneNumber)
        const otp = await this.homeService.generateOtp(request['query']['phone_number']);  // Service to generate OTP and send SMS
        return { message: 'OTP sent successfully' };
    }

    

    @Get('/verify-otp')
    @HttpCode(200)
    async verifyOtp(@Req() request: Request) {
        
        let phoneNumber = request['query']['phone_number'];
        let otp = request['query']['otp'];
        const isValid = await this.homeService.verifyOtp(phoneNumber, otp);
        if (isValid) {
            const token = await this.homeService.generateJWT(phoneNumber); // Service to generate JWT
            // to add the login user if not exist
            let userDetails = await this.homeService.addUser(phoneNumber);
            return { token, userDetails };  // Return JWT token if OTP is valid
        } else {
            return { statusCode: 401, message: 'Invalid OTP' };
        }
    }

    @Get('/top-categories')
    @HttpCode(200)
    async getTopCategory() {
        return await this.homeService.getTopCategories();
    }

    @Get('/brands')
    @HttpCode(200)
    async getBrands() {
        return await this.homeService.getBrands();
    }
    @Get('/getRecommenedProducts')
    @HttpCode(200)
    async getRecommenedProducts(@Req() request: Request) {
        return await this.homeService.getRecommenedProducts(request['query']);
    }


    @Get('/getSelectedCategoryProduct')
    @HttpCode(200)
    async getSelectedCategoryProduct(@Req() request: Request) {
        return await this.homeService.getSelectedCategoryProduct(request['query']);
    }

    @Get('/getSelectedBrandProduct')
    @HttpCode(200)
    async getSelectedBrandProduct(@Req() request: Request) {
        return await this.homeService.getSelectedBrandProduct(request['query']);
    } 

    @Get('/getProductDetails')
    @HttpCode(200)
    async getProductDetails(@Req() request: Request) {
        return await this.homeService.getProductDetails(request['query']);
    }

    @Get('/checkWishlistStatus')
    @HttpCode(200)
    async checkWishlistStatus(@Req() request: Request) {
        return await this.homeService.checkWishlistStatus(request['query']);
    }

    @Get('/addToWishlist')
    @HttpCode(200)
    async addToWishlist(@Req() request: Request) {
        return await this.homeService.addToWishlist(request['query']);
    }

    @Get('/removeFromWishlist')
    @HttpCode(200)
    async removeFromWishlist(@Req() request: Request) {
        return await this.homeService.removeFromWishlist(request['query']);
    } 
    
    @Get('/getWishlistedProducts')
    @HttpCode(200)
    async getWishlistedProducts(@Req() request: Request) {
        return await this.homeService.getWishlistedProducts(request['query']);
    }
    
    @Get('/addToCart')
    @HttpCode(200)
    async addToCart(@Req() request: Request) {
        return await this.homeService.addToCart(request['query']);
    }
    
    @Get('/getCartDetails')
    @HttpCode(200)
    async getCartDetails(@Req() request: Request) {
        return await this.homeService.getCartDetails(request['query']);
    }
    
    @Get('/updateCartInfo')
    @HttpCode(200)
    async updateCartInfo(@Req() request: Request) {
        console.log('Req', request)
        console.log('Req1', request['query'])
        return await this.homeService.updateCartInfo(request['query']);
    }
    
    @Get('/removeFromCart')
    @HttpCode(200)
    async removeFromCart(@Req() request: Request) {
        return await this.homeService.removeFromCart(request['query']);
    }
    
    @Get('/getSearchedList')
    @HttpCode(200)
    async getSearchedList(@Req() request: Request) {
        return await this.homeService.getSearchedList(request['query']);
    }
    
    @Get('/getUserLocation')
    @HttpCode(200)
    async getUserLocation(@Req() request: Request) {
        return await this.homeService.getUserLocation(request['query']);
    }
    
    @Get('/fetchPlaceSuggestions')
    @HttpCode(200)
    async fetchPlaceSuggestions(@Req() request: Request) {
        return await this.homeService.fetchPlaceSuggestions(request['query']);
    }
    
    @Get('/fetchSelectedAddressDeatils')
    @HttpCode(200)
    async fetchSelectedAddressDeatils(@Req() request: Request) {
        return await this.homeService.fetchSelectedAddressDeatils(request['query']);
    } 
    
    @Get('/addNewAddress')
    @HttpCode(200)
    async addNewAddress(@Req() request: Request) {
        return await this.homeService.addNewAddress(request['query']);
    }
    
    @Get('/getSavedAddress')
    @HttpCode(200)
    async getSavedAddress(@Req() request: Request) {
        return await this.homeService.getSavedAddress(request['query']);
    }


    // POST /send-otp
//   @Post('/send-otp')
//   @HttpCode(200)
//   async sendOtp(@Body('phone_number') phoneNumber: string) {
//     const otp = await this.homeService.generateOtp(phoneNumber);  // Service to generate OTP and send SMS
//     return { message: 'OTP sent successfully' };
//   }

  // POST /verify-otp
//   @Post('/verify-otp')
//   @HttpCode(200)
//   async verifyOtp(
//     @Body('phone_number') phoneNumber: string,
//     @Body('otp') otp: string,
//   ) {
//     const isValid = await this.homeService.verifyOtp(phoneNumber, otp);
//     if (isValid) {
//       const token = this.homeService.generateJWT(phoneNumber); // Service to generate JWT
//       return { token };  // Return JWT token if OTP is valid
//     } else {
//       return { statusCode: 401, message: 'Invalid OTP' };
//     }
//   }

}
