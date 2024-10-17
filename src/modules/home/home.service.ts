import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';


import { CommonLogicService } from 'src/common-logic/common-logic.service';
import e from 'express';

@Injectable()
export class HomeService {
    private otps = new Map(); // Store OTPs temporarily in-memory (can use Redis or DB in production)

    constructor(private readonly commonLogicService: CommonLogicService, private readonly jwtService: JwtService, private configService: ConfigService, private httpService: HttpService) {}

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
        let query = "INSERT INTO users.wishlist(user_id, product_id) VALUES(?, ?) ON DUPLICATE KEY UPDATE added_at = CURRENT_TIMESTAMP()";
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
        let query = `SELECT a.cart_id, a.user_id, a.product_id, a.size, a.quantity, b.brand_name, b.product_short_name, b.main_image, b.selling_price, b.mrp, b.discount_percent
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

    async updateCartInfo(request){
        let product = JSON.parse(request.product);
        let cart_id = product.cart_id;
        let quantity = product.quantity;
        let size = product.size;

        let query = `UPDATE users.cart SET quantity = ?, size = ? WHERE cart_id = ?`;

        let whereParams = [quantity, size, cart_id];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':'Cart Updated Succesfully'};
        }
        catch{
            return {"message": 'error', code: 500, 'result':'Failed to update cart info'};
        }
    }

    async removeFromCart(request){
        let cart_id = request.cart_id;
        let query = `delete from users.cart where cart_id = ?`;
        
        let whereParams = [cart_id];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':'Removed Succesfully'};
        }
        catch{
            return {"message": 'error', code: 500, 'result':'Failed to remove from cart'};
        }
    }

    async getSearchedList(request){
        let searchedText = request.searchedText;

        let query = 
        `SELECT category_id, category_name, "category_name" as type FROM products.top_categories WHERE category_name LIKE ? 
        UNION SELECT brand_id, brand_name, "brand_name" as type FROM products.brands WHERE brand_name LIKE ?
        UNION SELECT product_id, product_short_name, "product_short_name" as type FROM products.products_master WHERE product_short_name LIKE ? 
        UNION SELECT product_id, product_name, "product_name" as type FROM products.products_master WHERE product_name LIKE ? limit 5`;
        let whereParams = ['%'+searchedText+'%', '%'+searchedText+'%', '%'+searchedText+'%', '%'+searchedText+'%'];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }catch{
            return {"message": 'error', code: 500, 'result':[]};
        }

        // products.brands
    }

    async getUserLocation(request){
        let lon = request.lon;
        let lat = request.lat;

        const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
        // const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
        // const response = await lastValueFrom(this.httpService.get(url));
        // const locationData = response.data;

        // // Format the response to match your desired structure
        // const formattedResponse = {
        // is_serviceable: true,
        // poi_data: { /* your polygon data here */ },
        // location_info: {
        //     sublocalities: locationData.results[0].address_components.filter((c: any) => c.types.includes('sublocality')),
        //     city: locationData.results[0].address_components.find((c: any) => c.types.includes('locality')).long_name,
        //     district: locationData.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_2')).long_name,
        //     state: locationData.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_1')).long_name,
        //     country: locationData.results[0].address_components.find((c: any) => c.types.includes('country')).long_name,
        //     postal_code: locationData.results[0].address_components.find((c: any) => c.types.includes('postal_code')).long_name,
        //     formatted_address: locationData.results[0].formatted_address
        // },
        // display_address: {
        //     title: locationData.results[0].address_components.find((c: any) => c.types.includes('sublocality'))?.long_name || '',
        //     description: locationData.results[0].formatted_address,
        //     address_line: locationData.results[0].formatted_address
        // },
        // coordinate: {
        //     lat: lat,
        //     lon: lon
        // }
        // };


        const formattedResponse = {
            "is_serviceable": true,
            "poi_data": {},
            "location_info": {
                "sublocalities": [
                    {
                        "long_name": "Devin Paradise Enclave",
                        "short_name": "Devin Paradise Enclave",
                        "types": [
                            "political",
                            "sublocality",
                            "sublocality_level_2"
                        ]
                    }
                ],
                "city": "Bengaluru",
                "district": "Bangalore Division",
                "state": "Karnataka",
                "country": "India",
                "postal_code": "560064",
                "formatted_address": "TOWER-F, DEVIN PARADISE ENCLAVE, Nikoo Homes 2 Rd, Devin Paradise Enclave, Bengaluru, Nagareshwara - Nagenahalli, Karnataka 560064, India"
            },
            "display_address": {
                "title": "Devin Paradise Enclave",
                "description": "TOWER-F, DEVIN PARADISE ENCLAVE, Nikoo Homes 2 Rd, Devin Paradise Enclave, Bengaluru, Nagareshwara - Nagenahalli, Karnataka 560064, India",
                "address_line": "TOWER-F, DEVIN PARADISE ENCLAVE, Nikoo Homes 2 Rd, Devin Paradise Enclave, Bengaluru, Nagareshwara - Nagenahalli, Karnataka 560064, India"
            },
            "coordinate": {
                "lat": "13.0805688",
                "lon": "77.6401022"
            }
        }
        
        return formattedResponse;
    }

    async fetchPlaceSuggestions(request) {

        const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
        const input = request.searchedText;
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&components=country:in&key=${apiKey}`;
        
        try {
            const response = await lastValueFrom(this.httpService.get(url));
            const locationData = JSON.parse(JSON.stringify(response.data));
            return locationData;
        } catch (error) {
            console.error('Error fetching place suggestions:', error);
            throw new Error('Failed to fetch place suggestions');
        }
        
    }
      
    async fetchSelectedAddressDeatils(request) {
        const placeId = request.placeId;

        const apiKey = this.configService.get<string>('GOOGLE_API_KEY');

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
        try {
            const response = await lastValueFrom(this.httpService.get(url));

            const locationInfo = JSON.parse(JSON.stringify(response.data.result));
            const formattedResponse = {
                is_serviceable: true,  // You can add your logic here for serviceability
                poi_data: { polygons: [] },  // Placeholder, as Blinkit does
                location_info: {
                    sublocalities: locationInfo.address_components.filter((component) => component.types.includes('sublocality')).map((comp) => comp.long_name),
                    city: locationInfo.address_components.find((comp) => comp.types.includes('locality'))?.long_name,
                    district: locationInfo.address_components.find((comp) => comp.types.includes('administrative_area_level_2'))?.long_name,
                    country: locationInfo.address_components.find((comp) => comp.types.includes('country'))?.long_name,
                    state: locationInfo.address_components.find((comp) => comp.types.includes('administrative_area_level_1'))?.long_name,
                    postal_code: locationInfo.address_components.find((comp) => comp.types.includes('postal_code'))?.long_name || '',
                    formatted_address: locationInfo.formatted_address,
                    premises: [],
                    street: [],
                    landmarks: []
                },
                display_address: {
                    title: locationInfo.name,
                    description: `${locationInfo.address_components.find((comp) => comp.types.includes('administrative_area_level_2'))?.long_name}, ${locationInfo.address_components.find((comp) => comp.types.includes('locality'))?.long_name}, ${locationInfo.address_components.find((comp) => comp.types.includes('administrative_area_level_1'))?.long_name}, ${locationInfo.address_components.find((comp) => comp.types.includes('country'))?.long_name}`,
                    address_line: locationInfo.formatted_address
                },
                coordinate: {
                    lat: locationInfo.geometry.location.lat,
                    lon: locationInfo.geometry.location.lng
                },
                locality: locationInfo.address_components.find((comp) => comp.types.includes('sublocality'))?.long_name || '',
                city: locationInfo.address_components.find((comp) => comp.types.includes('locality'))?.long_name || '',
                alias_id: 0  // Placeholder, add your alias logic if needed
            };
            return formattedResponse;
        } catch (error) {
            console.error('Error fetching place details:', error);
            throw new Error('Failed to fetch place details');
        }

    }
    


}
