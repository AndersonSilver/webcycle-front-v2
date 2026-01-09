# Exemplos Práticos - Backend com TypeORM e Google OAuth

## 📦 Package.json

```json
{
  "name": "tb-psico-backend",
  "version": "1.0.0",
  "description": "Backend API com TypeORM e Google OAuth",
  "main": "dist/app.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/config/database.config.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/config/database.config.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/config/database.config.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.1.13",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "express-session": "^1.17.3",
    "cookie-parser": "^1.4.6"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/passport": "^1.0.16",
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/passport-jwt": "^4.0.1",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express-session": "^1.17.10",
    "@types/cookie-parser": "^1.4.6",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
```

## ⚙️ Configuração TypeORM

```typescript
// src/config/database.config.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';
import { Module } from '../entities/Module.entity';
import { Lesson } from '../entities/Lesson.entity';
import { Purchase } from '../entities/Purchase.entity';
import { PurchaseCourse } from '../entities/PurchaseCourse.entity';
import { Progress } from '../entities/Progress.entity';
import { Coupon } from '../entities/Coupon.entity';
import { Review } from '../entities/Review.entity';
import { CartItem } from '../entities/CartItem.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'tb_psico',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    User,
    Course,
    Module,
    Lesson,
    Purchase,
    PurchaseCourse,
    Progress,
    Coupon,
    Review,
    CartItem,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});
```

## 🔐 Configuração Passport e Google OAuth

```typescript
// src/config/passport.config.ts
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import { User } from '../entities/User.entity';
import { AppDataSource } from './database.config';

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        
        // Verificar se usuário já existe pelo Google ID
        let user = await userRepository.findOne({
          where: { googleId: profile.id },
        });

        if (!user) {
          // Verificar se existe pelo email
          user = await userRepository.findOne({
            where: { email: profile.emails[0].value },
          });

          if (user) {
            // Atualizar usuário existente com Google ID
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            user.emailVerified = true;
            await userRepository.save(user);
          } else {
            // Criar novo usuário
            user = userRepository.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              avatar: profile.photos[0].value,
              emailVerified: true,
              role: 'student',
            });
            await userRepository.save(user);
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: payload.userId },
        });

        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
```

## 🎯 Exemplo: AuthController Completo

```typescript
// src/controllers/AuthController.ts
import { Request, Response, Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.config';
import { User, UserRole } from '../entities/User.entity';
import { AuthService } from '../services/AuthService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class AuthController {
  private router: Router;
  private authService: AuthService;

  constructor() {
    this.router = Router();
    this.authService = new AuthService();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Registro com email/senha
    this.router.post('/register', this.register.bind(this));
    
    // Login com email/senha
    this.router.post('/login', this.login.bind(this));
    
    // Google OAuth - Iniciar
    this.router.get(
      '/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    
    // Google OAuth - Callback
    this.router.get(
      '/google/callback',
      passport.authenticate('google', { session: false }),
      this.googleCallback.bind(this)
    );
    
    // Obter usuário autenticado
    this.router.get('/me', AuthMiddleware.authenticate, this.getMe.bind(this));
    
    // Logout
    this.router.post('/logout', AuthMiddleware.authenticate, this.logout.bind(this));
  }

  private async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const result = await this.authService.register({
        name,
        email,
        password,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  private async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  private async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const token = this.authService.generateToken(user);

      // Redirecionar para frontend com token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getMe(req: Request, res: Response) {
    try {
      const user = req.user as User;
      res.json({ user: this.authService.sanitizeUser(user) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async logout(req: Request, res: Response) {
    // Em uma implementação completa, você invalidaria o token
    res.json({ message: 'Logout realizado com sucesso' });
  }

  public getRouter(): Router {
    return this.router;
  }
}
```

## 🔧 Exemplo: AuthService Completo

```typescript
// src/services/AuthService.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { User, UserRole } from '../entities/User.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async register(registerDto: RegisterDto) {
    // Verificar se email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Criar usuário
    const user = this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });

    await this.userRepository.save(user);

    // Gerar token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string) {
    // Buscar usuário
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    if (!user.password) {
      throw new Error('Este usuário foi cadastrado via Google. Use login social.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

## 🛡️ Exemplo: AuthMiddleware

```typescript
// src/middleware/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export class AuthMiddleware {
  static authenticate(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (err || !user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      req.user = user;
      next();
    })(req, res, next);
  }

  static requireAdmin(req: Request, res: Response, next: NextFunction) {
    AuthMiddleware.authenticate(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
      }
    });
  }
}
```

## 🚀 App Principal

```typescript
// src/app.ts
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { AppDataSource } from './config/database.config';
import './config/passport.config';
import { AuthController } from './controllers/AuthController';
import { CourseController } from './controllers/CourseController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', new AuthController().getRouter());
app.use('/api/courses', new CourseController().getRouter());

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Inicializar banco de dados e servidor
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });
```

## 📋 Checklist de Implementação

- [ ] Instalar dependências: `npm install`
- [ ] Configurar variáveis de ambiente no `.env`
- [ ] Criar projeto no Google Cloud Console
- [ ] Configurar OAuth 2.0 Credentials
- [ ] Criar todas as entidades TypeORM
- [ ] Criar migrations: `npm run migration:generate`
- [ ] Executar migrations: `npm run migration:run`
- [ ] Implementar controllers e services
- [ ] Testar autenticação Google OAuth
- [ ] Testar autenticação JWT
- [ ] Conectar com frontend

## 🔗 Integração Frontend

No frontend React, adicionar botão de login Google:

```typescript
// Componente de Login
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3001/api/auth/google';
};

// Callback após autenticação
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('token', token);
    // Redirecionar para dashboard
  }
}, []);
```

