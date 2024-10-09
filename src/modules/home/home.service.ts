import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


import { CommonLogicService } from 'src/common-logic/common-logic.service';
import e from 'express';

@Injectable()
export class HomeService {
    private otps = new Map(); // Store OTPs temporarily in-memory (can use Redis or DB in production)

    constructor(private readonly commonLogicService: CommonLogicService, private readonly jwtService: JwtService, private configService: ConfigService) {}

      // Function to generate OTP
    async generateOtp(phoneNumber: string): Promise<void> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
        this.otps.set(phoneNumber, otp); // Save OTP in-memory for the phone number
        // Here you would send the OTP via SMS (e.g., Twilio or Firebase SMS)
        console.log(`OTP for ${phoneNumber} is ${otp}`);
    }

    // Function to verify OTP
    async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
        
        const storedOtp = this.otps.get(phoneNumber); // Get stored OTP for the phone number
        return storedOtp === otp; // Check if OTP matches
    }

    // Function to generate JWT
    generateJWT(phoneNumber: string): string {
        const payload = { phoneNumber };  // Payload for the JWT
        const secret = this.configService.get<string>('JWT_SECRET');

        try {
            const token = this.jwtService.sign(payload, { secret: secret });
            return token;
          } catch (error) {
            console.error('Error generating JWT:', error);
            throw error;
          }
    }
    // insert if user does not exist
    async addUser(phoneNumber: string) {
        const query = 'INSERT IGNORE INTO users.users_list (phone_number) VALUES (?)';
        const params = [phoneNumber];
        try{
            await this.commonLogicService.dbCallPdoWIBuilder(query, params, 'DB_CONN');
            let result = await this.getLoggedInUserDetails(phoneNumber);
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'cannot add user', code: 500, 'result':[]};
        }
    }

    async getLoggedInUserDetails(phoneNumber: string){
        let query = "SELECT * FROM users.users_list WHERE phone_number = ?";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, [phoneNumber],'DB_CONN');
            return result;
        }
        catch{
            return [];
        }

    }
    
    async getHome(){
        let query = "SELECT * FROM brands.category";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
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
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }

    }

    async getBrands(){
        let query = "SELECT * FROM products.brands";
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }

    }

    async getSelectedCategoryProduct(request){
        let category_id = request.category_id;
        let user_id = request.user_id;

        // let query = "SELECT * FROM products.products_master where category_id = '"+category_id+"'";
        // query += "AND availability = 'In Stock' AND is_active = 1";

        let query = `SELECT 
            a.*, 
            CASE 
                WHEN b.product_id IS NOT NULL THEN 1 
                ELSE 0 
            END AS iswishlisted
        FROM (
            SELECT * 
            FROM products.products_master 
            WHERE category_id = ? AND is_active = 1 AND availability = 'In Stock'
        ) a
        LEFT JOIN users.wishlist b 
            ON a.product_id = b.product_id
            AND b.user_id = ?`;
        
        let whereParams = [category_id, user_id];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getRecommenedProducts(request){
        let user_id = request.user_id;
        // let query = "SELECT * FROM products.products_master WHERE is_active = 1 AND availability = 'In Stock' ORDER BY discount_percent DESC LIMIT 10";
        let query = `SELECT 
                    a.*, 
                    CASE 
                        WHEN b.product_id IS NOT NULL THEN 1 
                        ELSE 0 
                    END AS iswishlisted
                FROM (
                    SELECT * 
                    FROM products.products_master 
                    WHERE is_active = 1 
                    AND availability = 'In Stock' 
                    ORDER BY discount_percent DESC 
                    LIMIT 10
                ) a
                LEFT JOIN users.wishlist b 
                    ON a.product_id = b.product_id
                    AND b.user_id = ?`;

        
        let whereParams = [user_id];

        
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getSelectedBrandProduct(request){
        let brand_id = request.brand_id;
        let user_id = request.user_id;

        // let query = "SELECT * FROM products.products_master WHERE brand_id = '" + brand_id + "'";
        // query += "AND availability = 'In Stock' AND is_active = 1";

        let query = `SELECT 
            a.*, 
            CASE 
                WHEN b.product_id IS NOT NULL THEN 1 
                ELSE 0 
            END AS iswishlisted
        FROM (
            SELECT * 
            FROM products.products_master 
            WHERE brand_id = ? AND is_active = 1 AND availability = 'In Stock'
        ) a
        LEFT JOIN users.wishlist b 
            ON a.product_id = b.product_id
            AND b.user_id = ?`;
        
        let whereParams = [brand_id, user_id];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getProductDetails(request){
        let product_id = request.product_id;
        let query = "SELECT * FROM products.products_master WHERE product_id = '" + product_id + "'";

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, {},'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }


    async checkWishlistStatus(request){
        let user_id = request.user_id;
        let product_id = request.product_id;
        let query = "SELECT IF(count(1)>0, 1, 0) as inWishlist FROM users.wishlist WHERE product_id = ? AND user_id = ?";
        let whereParams = [product_id, user_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async addToWishlist(request){
        let user_id = request.user_id;
        let product_id = request.product_id;
        let query = "INSERT INTO users.wishlist(user_id, product_id) VALUES(?, ?)";
        let whereParams = [user_id, product_id];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async removeFromWishlist(request){
        let user_id = request.user_id;
        let product_id = request.product_id;
        let query = "DELETE FROM users.wishlist WHERE product_id = ? AND user_id = ?";
        let whereParams = [product_id, user_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }


    async getWishlistedProducts(request){
        let user_id = request.user_id;

        let query = "select b.* from users.wishlist a join products.products_master b on a.product_id=b.product_id where a.user_id = ?"
        let whereParams = [user_id];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }
    // if already in cart then increase the quantity by 1
    async addToCart(request){
        let user_id = request.user_id;
        let product_id = request.product_id;
        let size = request.size;
        let whereParams = [user_id, product_id, size];

        let checkquery = "SELECT count(1) as count FROM users.cart WHERE user_id = ? AND product_id = ? AND size = ?";
        let checkwhereParams = whereParams;
        try{
            let checkresult = await this.commonLogicService.dbCallPdoWIBuilder(checkquery, checkwhereParams,'DB_CONN');

            if(checkresult[0].count > 0){
                let query = "UPDATE users.cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ? AND size = ?";
                try{
                    let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
                    return {"message": 'sucess', code: 200, 'result':'quantity updated successfully'};
                }
                catch{
                    return {"message": 'error', code: 500, 'result': 'cannot update quantity'};
                }
            }else{
                
                let query = "INSERT INTO users.cart(user_id, product_id, size) VALUES(?, ?, ?)";
                
                try{
                    let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
                    return {"message": 'sucess', code: 200, 'result':'Added to cart successfully'};
                }
                catch{
                    return {"message": 'error', code: 500, 'result':'Cannot add to cart'};
                }
            }
        }
        catch{
            return {"message": 'error', code: 500, 'result':'error in fetching cart details'};
        }
    }

    async getCartDetails(request){
        let user_id = request.user_id;
        let query = `SELECT a.user_id, a.product_id, a.size, a.quantity, b.brand_name, b.product_short_name, b.main_image, b.selling_price, b.mrp, b.discount_percent
        FROM users.cart a 
        JOIN products.products_master b 
        ON a.product_id = b.product_id 
        WHERE a.user_id = ? `;
        
        let whereParams = [user_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }
}
