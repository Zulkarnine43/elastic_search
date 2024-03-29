import axios from 'axios';
import { MediaSoftProductDto, MediaSoftProductStockDto } from './dto/create-db-migration.dto';

export class ApiService {
    private static key = '';

    async mediaSoftApi(mediaSoftProductDto: MediaSoftProductDto) {
        return this.apiCall('Product/GetProductData', mediaSoftProductDto || {});
    }

    async mediaSoftStockApi(mediaSoftProductStockDto: MediaSoftProductStockDto) {
        return await this.apiCall('Product/GetProductStockInfo', {
            barcode: mediaSoftProductStockDto?.barcode || 'ALL',
            modelName: mediaSoftProductStockDto?.modelName || 'ALL',
            shopID: mediaSoftProductStockDto?.shopID || 'ALL',
        });
    }

    async login() {
        const response = await this.apiCall(
            'Accounts/authenticate/Account/authenticate',
            {
                client_id: '123456',
                client_secret: '123456',
            },
        );
        ApiService.key = response.data.access_token;
        return;
    }

    async apiCall(url, body) {
        const config = {
            headers: {
                Access_token: ApiService.key,
                Accept: 'application/json',
            },
        };
        const response = await axios.post(
            'http://203.76.110.162:8081/' + url,
            body,
            config,
        );
        if (response.status == 200) return response.data;
    }
}
