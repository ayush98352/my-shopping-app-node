import { Injectable } from '@nestjs/common';

import { CommonLogicService } from 'src/common-logic/common-logic.service';

@Injectable()
export class HomeService {

    constructor(private readonly commonLogicService: CommonLogicService) {}

    async getHome(){
        let query = "SELECT * FROM brands.category";
        console.log('quer', query)
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            console.log('result', result);
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }

    }

    async getTopCategories(){
        let query = "SELECT * FROM products.top_categories";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 500, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }

    }

    async getBrands(){
        let query = "SELECT * FROM products.brands";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 500, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }

    }

    async getSelectedCategoryProduct(request){
        let category_id = request.category_id;
        let query = "SELECT * FROM products.products_master where category_id = '"+category_id+"'";
        query += "AND availability = 'In Stock' AND is_active = 1";
        // let whereParams = {}
        // whereParams.push(1);
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 500, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getRecommenedProducts(){
        let query = "SELECT * FROM products.products_master WHERE is_active = 1 AND availability = 'In Stock' ORDER BY discount_percent DESC LIMIT 10";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 500, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getSelectedBrandProduct(request){
        let brand_id = request.brand_id;
        let query = "SELECT * FROM products.products_master WHERE brand_id = '" + brand_id + "'";
        query += "AND availability = 'In Stock' AND is_active = 1";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 500, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getProductDetails(request){
        let product_id = request.product_id;
        console.log('hey', product_id)
        let query = "SELECT * FROM products.products_master WHERE product_id = '" + product_id + "'";

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 500, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }
}
