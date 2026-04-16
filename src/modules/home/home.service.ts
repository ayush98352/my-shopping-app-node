import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';


import { CommonLogicService } from 'src/common-logic/common-logic.service';
import { TranslationService } from './translation.service';
import * as moment from 'moment';


@Injectable()
export class HomeService implements OnModuleInit {
    private otps = new Map(); // Store OTPs temporarily in-memory (can use Redis or DB in production)

    constructor(private readonly commonLogicService: CommonLogicService, private readonly jwtService: JwtService, private configService: ConfigService, private httpService: HttpService, private readonly translationService: TranslationService) {}

    onModuleInit() {
        // Fire-and-forget: pre-warm translation cache from DB so first real requests are instant
        this.preWarmTranslations().catch(() => {});
    }

    private async preWarmTranslations() {
        try {
            // Fields that need translation (meaning conversion)
            const translateQueries = [
                `SELECT DISTINCT category_name as val FROM products.top_categories WHERE category_name IS NOT NULL`,
                `SELECT DISTINCT category_name as val FROM products.product_categories WHERE category_name IS NOT NULL`,
                `SELECT DISTINCT ideal_for as val FROM products.products_master WHERE ideal_for IS NOT NULL`,
                `SELECT DISTINCT product_short_name as val FROM products.products_master WHERE product_short_name IS NOT NULL LIMIT 500`,
            ];

            // Fields that need transliteration (phonetic conversion — proper nouns)
            const transliterateQueries = [
                `SELECT DISTINCT brand_name as val FROM products.brands WHERE brand_name IS NOT NULL`,
                `SELECT DISTINCT name as val FROM products.stores WHERE name IS NOT NULL`,
                `SELECT DISTINCT name as val FROM products.malls WHERE name IS NOT NULL`,
            ];

            const translateStrings: string[] = [];
            for (const q of translateQueries) {
                try {
                    const rows: any[] = await this.commonLogicService.dbCallPdoWIBuilder(q, [], 'DB_CONN');
                    for (const row of rows) {
                        if (row.val) translateStrings.push(row.val);
                    }
                } catch { /* skip if table doesn't exist */ }
            }

            const transliterateStrings: string[] = [];
            for (const q of transliterateQueries) {
                try {
                    const rows: any[] = await this.commonLogicService.dbCallPdoWIBuilder(q, [], 'DB_CONN');
                    for (const row of rows) {
                        if (row.val) transliterateStrings.push(row.val);
                    }
                } catch { /* skip if table doesn't exist */ }
            }

            // Run both in parallel
            await Promise.all([
                this.translationService.preWarm(translateStrings, 'en', 'hi'),
                this.translationService.preWarmTransliteration(transliterateStrings, 'hi'),
            ]);
        } catch (e) {
            console.warn('[HomeService] Translation pre-warm failed:', e?.message);
        }
    }


      // Function to generate OTP
    async generateOtp(phoneNumber: string): Promise<void> {
        const otp = (crypto.randomInt(900000) + 100000).toString(); // cryptographically secure 6-digit OTP
        this.otps.set(phoneNumber, otp);
        console.log(`OTP for ${phoneNumber} is ${otp}`);
        // TODO: send OTP via SMS (e.g., Twilio or Firebase)
    }

    // Function to verify OTP
    async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
        
        const storedOtp = this.otps.get(phoneNumber); // Get stored OTP for the phone number

        if (storedOtp === otp) {
            this.otps.delete(phoneNumber); // Remove OTP from memory after successful verification
            return true;
        } else {
            return false;
        }
    }

    // Function to generate JWT
    generateJWT(phoneNumber: string, userId: string | number): string {
        const payload = { phoneNumber, userId };
        const secret = this.configService.get<string>('JWT_SECRET');

        try {
            const token = this.jwtService.sign(payload, { secret });
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
        catch(e){
            console.error('[getBrands]', e);
            return {"message": 'error', code: 500, 'result':[]};
        }

    }

    async getSelectedCategoryProduct(request){
        let category_id = request.category_id;
        let user_id = request.user_id;
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 30, 10), 1), 100);
        let offset = Math.max(parseInt(request?.offset ?? 0, 10), 0);


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
            AND b.user_id = ? limit ? OFFSET ?` ;
        
        let whereParams = [category_id, user_id, limit, offset];

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
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 10, 10), 1), 100);
        let offset = Math.max(parseInt(request?.offset ?? 0, 10), 0);

        
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
                    LIMIT ? OFFSET ?
                ) a
                LEFT JOIN users.wishlist b 
                    ON a.product_id = b.product_id
                    AND b.user_id = ?`;

        
        let whereParams = [limit, offset, user_id];
        
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }
        catch(e){
            console.error('[getRecommenedProducts]', e);
            return {"message": 'error', code: 500, 'result': []};
        }
    }

    async getSelectedBrandProduct(request){
        let brand_id = request.brand_id;
        let user_id = request.user_id;
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 30, 10), 1), 100);
        let offset = Math.max(parseInt(request?.offset ?? 0, 10), 0);

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
            AND b.user_id = ? limit ? OFFSET ?`;
        
        let whereParams = [brand_id, user_id, limit, offset];

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
        let query = "SELECT * FROM products.products_master WHERE product_id = ?";

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, [product_id],'DB_CONN');
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
        catch(e){
           console.error('[addToWishlist]', e);
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
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 10, 10), 1), 100);
        let offset = Math.max(parseInt(request?.offset ?? 0, 10), 0);

        let query = "select b.* from users.wishlist a join products.products_master b on a.product_id=b.product_id where a.user_id = ? order by a.wishlist_id desc limit ? OFFSET ?"
        let whereParams = [user_id, limit, offset];

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
        let query = `SELECT a.cart_id, a.user_id, a.product_id, a.size, a.quantity, b.brand_name, b.product_short_name, b.images, b.selling_price, b.mrp, b.discount_percent
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
        let product: any;
        try {
            product = typeof request.product === 'string' ? JSON.parse(request.product) : request.product;
        } catch {
            return {"message": 'invalid product data', code: 400, 'result': 'Failed to update cart info'};
        }
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

    async getSearchedList(request, lang = 'en'){
        let searchedText: string = String(request.searchedText ?? '').slice(0, 100);
        let searchTerms: string[] = [searchedText]; // default: search as-is

        if (lang === 'hi' && searchedText) {
            const isDevanagari = /[\u0900-\u097F]/.test(searchedText);

            if (isDevanagari) {
                // Devanagari script: translate directly to English, replace original
                const en = await this.translationService.translate(searchedText, 'hi', 'en');
                searchTerms = [en];
            } else {
                // Latin script: could be English or Hinglish
                // Chain: Latin → Devanagari (Google Input Tools) → English (Translate)
                const devanagari = await this.translationService.transliterate(searchedText, 'hi');
                if (devanagari && devanagari !== searchedText) {
                    const enFromHinglish = await this.translationService.translate(devanagari, 'hi', 'en');
                    // Dual search: original term (works for English) + translated term (works for Hinglish)
                    searchTerms = [...new Set([searchedText, enFromHinglish])];
                }
                // If transliterate returned same string (pure English), searchTerms stays [searchedText]
            }
        }

        // Build WHERE clause dynamically: (category_name LIKE ?) OR (category_name LIKE ?)
        const whereClauses = searchTerms.map(() => 'category_name LIKE ?').join(' OR ');
        const whereParams = searchTerms.map(t => `%${t}%`);
        const query = `select * from products.product_categories where (${whereClauses}) limit 10`;

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'sucess', code: 200, 'result':result};
        }catch{
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    async getUserLocation(request){
        try{
            let lon = request.lon;
            let lat = request.lat;

            const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&key=${apiKey}`;
            const response = await lastValueFrom(this.httpService.get(url));
            const locationData = response.data;
            
            if (locationData.status !== 'OK' || !locationData.results.length) {
                throw new Error(`Geocoding failed: ${locationData.status} - ${locationData.error_message}`);
            }

            // Format the response to match your desired structure
            const formattedResponse = {
            is_serviceable: true,
            poi_data: { /* your polygon data here */ },
            location_info: {
                sublocalities: locationData.results[0].address_components.filter((c: any) => c.types.includes('sublocality')),
                city: locationData.results[0].address_components.find((c: any) => c.types.includes('locality')).long_name,
                district: locationData.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_2')).long_name,
                state: locationData.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_1')).long_name,
                country: locationData.results[0].address_components.find((c: any) => c.types.includes('country')).long_name,
                postal_code: locationData.results[0].address_components.find((c: any) => c.types.includes('postal_code')).long_name,
                formatted_address: locationData.results[0].formatted_address
            },
            display_address: {
                title: locationData.results[0].address_components.find((c: any) => c.types.includes('sublocality'))?.long_name || '',
                description: locationData.results[0].formatted_address,
                address_line: locationData.results[0].formatted_address
            },
            coordinate: {
                lat: lat,
                lon: lon
            }
            };


            
            return formattedResponse;
        }catch(e){
            console.error('[getUserLocation] error:', e);
            return {"message": 'error fetching location', 'code': 500, 'result':[]};
        }
    }

    async fetchPlaceSuggestions(request) {

        const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
        const input = encodeURIComponent(String(request.searchedText ?? '').slice(0, 200));
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
        const placeId = encodeURIComponent(request.placeId);

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

    async addNewAddress(request){

        let query = `INSERT INTO users.saved_addresses (user_id, saved_as_name, phone, address_type, house_no, floor_no, tower_block, landmark, latitude, longitude, full_address, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        let whereParams = [
            request.userId,
            request.name,
            request.phone,
            request.addressType,
            request.houseNumber,
            request.floor,
            request.towerBlock,
            request.landmark,
            request.latitude,
            request.longitude,
            request.fullAddress,
            request.is_default
        ];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[addNewAddress]', e);
            return {"message": 'error saving address', code: 500, 'result':[]};
        }

    }

    async getSavedAddress(request){
        let user_id = request.user_id;
        let query = `SELECT * FROM users.saved_addresses WHERE user_id = ?`;
        let whereParams = [user_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getSavedAddress]', e);
            return {"message": 'error fetching addresses', code: 500, 'result':[]};
        }
    }

    async getExploreCategoryProduct(request, lang = 'en'){
        let gender = request.gender;
        let category = request.category;
        let sub_category = request.sub_category;
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 30, 10), 1), 100);
        let offset = Math.max(parseInt(request?.offset ?? 0, 10), 0);

        // If params arrive in Hindi (Devanagari), translate them back to English for DB lookup
        if (lang === 'hi') {
            if (gender && /[\u0900-\u097F]/.test(gender)) {
                gender = await this.translationService.translate(gender, 'hi', 'en');
            }
            if (category && /[\u0900-\u097F]/.test(category)) {
                category = await this.translationService.translate(category, 'hi', 'en');
            }
            if (sub_category && sub_category !== 'See all >' && /[\u0900-\u097F]/.test(sub_category)) {
                sub_category = await this.translationService.translate(sub_category, 'hi', 'en');
            }
        }

        let query = `select * from products.products_master where availability = 'In Stock' `;

        let whereParams = [];
        if(gender !== 'kids'){
            query += `and ideal_for = ? `;
            whereParams.push(gender);
        }else{
            query += `and category_id = '4' `;
        }
        if (sub_category !== 'See all >'){
            // Build both & and "and" variants to handle translation inconsistencies
            const subVariants = new Set([sub_category]);
            if (sub_category.includes(' & ')) {
                subVariants.add(sub_category.replace(/ & /g, ' and '));
            }
            if (sub_category.includes(' and ')) {
                subVariants.add(sub_category.replace(/ and /g, ' & '));
            }
            const subConditions = [...subVariants].map(() => 'product_category_name like ?').join(' OR ');
            query += `and (${subConditions}) `;
            subVariants.forEach(v => whereParams.push('%' + v + '%'));
        }
        else{
            query += `and product_top_category_name = ?`;
            whereParams.push(category);
        }

        query += ` limit ? OFFSET ?`;
        whereParams.push(limit);
        whereParams.push(offset);

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getExploreCategoryProduct]', e);
            return {"message": 'error', code: 500, 'result':[]};
        }
    }

    formatLocalDateTime() {
        const now = new Date();
      
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
      
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

    async addOrder(request){
        let user_id = request.user_id;
     
        let query = `INSERT INTO users.orders (user_id, order_date, order_status, mrp, product_discount, item_total, promo_discount, coupon_code, delivery_charges, extra_charges, extra_charges_name, tax_amount, total_amount, payment_status, transaction_details, shipping_status, shipping_address, receiver_name, reciever_contact_no, delivery_instructions, payment_method, product_images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let whereParams = [
            request.user_id, request.order_date, request.order_status, request.mrp, request.product_discount, request.item_total, request.promo_discount, request.coupon_code, request.delivery_charge, request.extra_charges, request.extra_charges_name, request.tax_amount, request.total_amount, request.payment_status, request.transaction_details, request.shipping_status, request.shipping_address, request.receiver_name, request.reciever_contact_no, request.delivery_instructions, request.payment_method, request.product_images
        ];

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            let order_id = await this.fetchLastOrderId(user_id);
            if(order_id?.code == 200){
                order_id = order_id.result[0].order_id;
            }else{
                return {"message": 'error', code: 500, 'result': 'Order Added Successfully'};
            }
            result = await this.addOrderItems(order_id, request.order_details);
            if(result?.code == 200){
                return {"message": 'success', code: 200, 'result': 'Order Added Successfully'};
            }else{
                return {"message": result?.message, code: 500, 'result': 'Order Was not Added Successfully'};
            }
        }catch(e){
            console.error('[addOrder]', e);
            return {"message": 'error placing order', code: 500, 'result':[]};
        }
    }

    async addOrderItems(order_id, order_details){
        for (const item of order_details) {
            let query = `INSERT INTO users.order_items (order_id, product_id, product_short_name, brand_name, quantity, size, selling_price, mrp, discount_percent, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            let whereParams = [order_id, item.product_id, item.product_short_name, item.brand_name, item.quantity, item.size, item.selling_price, item.mrp, item.discount_percent, item.images];

            try{
                let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
                
            }catch(e){
                console.error('[addOrderItems]', e);
                return {"message": 'error adding order items', code: 500, 'result':[]};
            }
        }
        return {"message": 'success', code: 200, 'result':' Order Items Added Successfully'};
    }

    async fetchLastOrderId(user_id){
        let query = `SELECT order_id FROM users.orders WHERE user_id = ? ORDER BY order_id DESC LIMIT 1`;
        let whereParams = [user_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[fetchLastOrderId]', e);
            return {"message": 'error fetching order id', code: 500, 'result':[]};
        }
    }

    async getOrdersList(request){
        let user_id = request.user_id;
        let query = `SELECT * FROM users.orders WHERE user_id = ? ORDER BY order_id DESC limit 10`;
        let whereParams = [user_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            result.forEach((item) => {
                item.order_date = moment(item?.order_date).format('DD MMM YYYY HH:mm:ss');    
                item.shipping_address = JSON.parse(item?.shipping_address);       
            });
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getOrdersList]', e);
            return {"message": 'error fetching orders', code: 500, 'result':[]};
        }
    }

    async getOrderItemsList(request){
        let order_id = request.order_id;
        let query = `SELECT a.* , b.rating, b.review_text, b.review_date, b.review_image
        FROM users.order_items a
        LEFT JOIN users.user_reviews b
        ON a.product_id = b.product_id and a.order_id = b.order_id
        WHERE a.order_id = ? 
        ORDER BY order_item_id`;

        let whereParams = [order_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getOrderItemsList]', e);
            return {"message": 'error fetching order items', code: 500, 'result':[]};
        }
    }

    async addDeliveryManRating(request){
        let query = `UPDATE users.order_items SET delivery_man_rating = ?
        WHERE order_id = ? `;
        let whereParams = [request?.delivery_man_rating, request?.order_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[addDeliveryManRating]', e);
            return {"message": 'error saving rating', code: 500, 'result':[]};
        }
    }

    async addProductReviewRating(request){
        let items = request.items;

        // let checkQuery = `SELECT count(1) FROM users.user_reviews WHERE user_id = ? AND order_id = ? AND product_id = ?`;
        for (const item of items) {
            if(item?.rating > 0){
                let checkQuery = `SELECT count(1) as count FROM users.user_reviews WHERE user_id = ? AND order_id = ? AND product_id = ?`;
                let checkWhereParams = [request?.user_id, request?.order_id, item?.product_id];
                let checkResult = await this.commonLogicService.dbCallPdoWIBuilder(checkQuery, checkWhereParams,'DB_CONN');
                
                if(checkResult[0]?.count == 0){
                    // add review
                    let query = `INSERT INTO users.user_reviews (user_id, order_id, product_id, rating, review_text, review_image, review_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    let whereParams = [request?.user_id, request?.order_id, item?.product_id, item?.rating, item?.review, item?.photos, item?.review_date];
                    try{
                        await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');

                    }catch(e){
                        console.error('[addProductReviewRating insert]', e);
                        return {"message": 'error saving review', code: 500, 'result':[]};
                    }
                }
                else{
                    // update review
                    let query = `UPDATE users.user_reviews SET rating = ?, review_text = ?, review_image = ?, review_date = ?
                    WHERE user_id = ? AND order_id = ? AND product_id = ?`;
                    let whereParams = [item?.rating, item?.review, item?.photos, item?.review_date, request?.user_id, request?.order_id, item?.product_id];
                    try{
                        await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');

                    }catch(e){
                        console.error('[addProductReviewRating update]', e);
                        return {"message": 'error updating review', code: 500, 'result':[]};
                    }
                }
            }
        }
        return {"message": 'success', code: 200, 'result':' Order Items Added Successfully'};
    }

    async getMallsList(request){
        let user_lat = parseFloat(request.latitude);
        let user_lon = parseFloat(request.longitude);
        if (isNaN(user_lat) || isNaN(user_lon) || user_lat < -90 || user_lat > 90 || user_lon < -180 || user_lon > 180) {
            return {"message": 'invalid coordinates', code: 400, 'result':[]};
        }
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 5, 10), 1), 100);
        let offset = Math.min(Math.max(parseInt(request?.offset ?? 0, 10), 0), 10000);
        let searchedText = request?.searchText ? String(request.searchText).slice(0, 100) : '';

        // let query = `SELECT *, ROUND((6371 * ACOS(COS(RADIANS(${user_lat})) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(${user_lon})) + SIN(RADIANS(${user_lat})) * SIN(RADIANS(latitude)))), 2) AS distance FROM products.malls ORDER BY distance  limit ? OFFSET ?`;

        let query = `SELECT *, ROUND((6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))), 2) AS distance FROM products.malls ORDER BY distance  limit ? OFFSET ?`;

        let whereParms: (string | number)[] = [user_lat, user_lon, user_lat, limit, offset];

        if(searchedText != ''){
            query = `SELECT *, ROUND((6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))), 2) AS distance FROM products.malls WHERE name LIKE ? ORDER BY distance  limit ? OFFSET ?`;

            whereParms = [user_lat, user_lon, user_lat, '%'+searchedText+'%', limit, offset];
        }

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParms,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getMallsList]', e);
            return {"message": 'error fetching malls', code: 500, 'result':[]};
        }
    }

    async getShopsList(request){
        let user_lat = parseFloat(request.latitude);
        let user_lon = parseFloat(request.longitude);
        if (isNaN(user_lat) || isNaN(user_lon) || user_lat < -90 || user_lat > 90 || user_lon < -180 || user_lon > 180) {
            return {"message": 'invalid coordinates', code: 400, 'result':[]};
        }
        let limit = Math.min(Math.max(parseInt(request?.limit ?? 10, 10), 1), 100);
        let offset = Math.min(Math.max(parseInt(request?.offset ?? 0, 10), 0), 10000);
        let searchedText = request?.searchText ? String(request.searchText).slice(0, 100) : '';

        // let query = `SELECT *, ROUND((6371 * ACOS(COS(RADIANS(${user_lat})) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(${user_lon})) + SIN(RADIANS(${user_lat})) * SIN(RADIANS(latitude)))), 2) AS distance FROM products.stores ORDER BY distance`;

        let query = `SELECT *, ROUND((6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))), 2) AS distance FROM products.stores ORDER BY distance limit ? OFFSET ?`;
        let whereParms: (string | number)[] = [user_lat, user_lon, user_lat, limit, offset];

        if(searchedText != ''){
            query = `SELECT *, ROUND((6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))), 2) AS distance FROM products.stores WHERE name LIKE ? ORDER BY distance limit ? OFFSET ?`;

            whereParms = [user_lat, user_lon, user_lat, '%'+searchedText+'%', limit, offset];
        }

        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParms,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getShopsList]', e);
            return {"message": 'error fetching shops', code: 500, 'result':[]};
        }
    }

    async getMallsStoresList(request){

        let query = `SELECT * FROM products.stores where mall_id = ?`;
        let whereParams = [request.mall_id];
        try{
            let result = await this.commonLogicService.dbCallPdoWIBuilder(query, whereParams,'DB_CONN');
            return {"message": 'success', code: 200, 'result':result};
        }catch(e){
            console.error('[getMallsStoresList]', e);
            return {"message": 'error fetching stores', code: 500, 'result':[]};
        }
    }

}
