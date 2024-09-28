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
    async getRecommenedProducts() {
        return await this.homeService.getRecommenedProducts();
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
}
