import { Controller, Get, HttpCode, Post , Body, Req, Query, Request} from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
    constructor(private readonly homeService: HomeService) {}

    @Post('/send-otp')
    @HttpCode(200)
    async sendOtp(@Req() request: Request) {
        const otp = await this.homeService.generateOtp(request.body['phone_number']);  // Service to generate OTP and send SMS
        return { message: 'OTP sent successfully' };
    }


    @Post('/verify-otp')
    @HttpCode(200)
    async verifyOtp(@Req() request: Request) {
        
        let phoneNumber = request.body['phone_number'];
        let otp = request.body['otp'];
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
    @Post('/getRecommenedProducts')
    @HttpCode(200)
    async getRecommenedProducts(@Req() request: Request) {
        const params = request.body; // Access the request body
        return await this.homeService.getRecommenedProducts(params);
    }


    @Post('/getSelectedCategoryProduct')
    @HttpCode(200)
    async getSelectedCategoryProduct(@Req() request: Request) {
        return await this.homeService.getSelectedCategoryProduct(request.body);
    }

    @Post('/getSelectedBrandProduct')
    @HttpCode(200)
    async getSelectedBrandProduct(@Req() request: Request) {
        return await this.homeService.getSelectedBrandProduct(request.body);
    } 

    @Post('/getProductDetails')
    @HttpCode(200)
    async getProductDetails(@Req() request: Request) {
        return await this.homeService.getProductDetails(request.body);
    }

    @Post('/checkWishlistStatus')
    @HttpCode(200)
    async checkWishlistStatus(@Req() request: Request) {
        return await this.homeService.checkWishlistStatus(request.body);
    }

    @Post('/addToWishlist')
    @HttpCode(200)
    async addToWishlist(@Req() request: Request) {
        return await this.homeService.addToWishlist(request.body);
    }

    @Post('/removeFromWishlist')
    @HttpCode(200)
    async removeFromWishlist(@Req() request: Request) {
        return await this.homeService.removeFromWishlist(request.body);
    } 
    
    @Post('/getWishlistedProducts')
    @HttpCode(200)
    async getWishlistedProducts(@Req() request: Request) {
        return await this.homeService.getWishlistedProducts(request.body);
    }
    
    @Post('/addToCart')
    @HttpCode(200)
    async addToCart(@Req() request: Request) {
        return await this.homeService.addToCart(request.body);
    }
    
    @Post('/getCartDetails')
    @HttpCode(200)
    async getCartDetails(@Req() request: Request) {
        return await this.homeService.getCartDetails(request.body);
    }
    
    @Post('/updateCartInfo')
    @HttpCode(200)
    async updateCartInfo(@Req() request: Request) {
        return await this.homeService.updateCartInfo(request.body);
    }
    
    @Post('/removeFromCart')
    @HttpCode(200)
    async removeFromCart(@Req() request: Request) {
        return await this.homeService.removeFromCart(request.body);
    }
    
    @Post('/getSearchedList')
    @HttpCode(200)
    async getSearchedList(@Req() request: Request) {
        return await this.homeService.getSearchedList(request.body);
    }
    
    @Post('/getUserLocation')
    @HttpCode(200)
    async getUserLocation(@Req() request: Request) {
        return await this.homeService.getUserLocation(request.body);
    }
    
    @Post('/fetchPlaceSuggestions')
    @HttpCode(200)
    async fetchPlaceSuggestions(@Req() request: Request) {
        return await this.homeService.fetchPlaceSuggestions(request.body);
    }
    
    @Post('/fetchSelectedAddressDeatils')
    @HttpCode(200)
    async fetchSelectedAddressDeatils(@Req() request: Request) {
        return await this.homeService.fetchSelectedAddressDeatils(request.body);
    } 
    
    @Post('/addNewAddress')
    @HttpCode(200)
    async addNewAddress(@Req() request: Request) {
        return await this.homeService.addNewAddress(request.body);
    }
    
    @Post('/getSavedAddress')
    @HttpCode(200)
    async getSavedAddress(@Req() request: Request) {
        return await this.homeService.getSavedAddress(request.body);
    }
    
    @Post('/getExploreCategoryProduct')
    @HttpCode(200)
    async getExploreCategoryProduct(@Req() request: Request) {
        return await this.homeService.getExploreCategoryProduct(request.body);
    }
    @Post('/addOrder')
    @HttpCode(200)
    async addOrder(@Req() request: Request) {
        return await this.homeService.addOrder(request.body);
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
