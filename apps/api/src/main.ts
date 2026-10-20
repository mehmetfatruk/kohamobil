import 'reflect-metadata';

import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './config/env.js';
import { createHttpApp } from './http-app.js';

const app = await createHttpApp(AppModule);
const config = app.get<AppConfig>(APP_CONFIG);
// Yalnızca yerel geliştirme: tarayıcı önizlemesi (Expo web) farklı porttan çağırır. Mobil uygulama CORS kullanmaz.
if (config.NODE_ENV === 'development') app.enableCors({ origin: true });
await app.listen({ host: config.HOST, port: config.PORT });
