import { v2 as cloudinary } from 'cloudinary';
import { EnvService } from '../configs/envs/env-service';

export const CLOUDINARY = 'CLOUDINARY';

const envService = EnvService.getInstance();

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    return cloudinary.config({
      cloud_name: envService.getCloudinaryCloudName(),
      api_key: envService.getCloudinaryApiKey(),
      api_secret: envService.getCloudinaryApiSecret(),
    });
  },
};

