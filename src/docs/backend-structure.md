# Estrutura do Backend - Plataforma de Cursos Tiago Bonifacio

## 📋 Visão Geral

Este documento descreve a estrutura completa do backend necessário para suportar a plataforma de cursos online.

## 🏗️ Arquitetura Recomendada

### Stack Tecnológica Definida
- **Node.js** com **Express**
- **TypeScript** para tipagem completa
- **PostgreSQL** como banco de dados
- **TypeORM** como ORM (Orientado a Objetos com Decorators)
- **JWT** para autenticação
- **Passport.js** com **Google OAuth 2.0** para login social
- **Mercado Pago** para pagamentos
- **AWS S3** ou **Cloudinary** para armazenamento de vídeos/imagens
- **Class-validator** e **Class-transformer** para validação

## 📁 Estrutura de Pastas

```
backend/
├── src/
│   ├── config/              # Configurações
│   │   ├── database.config.ts
│   │   ├── env.config.ts
│   │   ├── jwt.config.ts
│   │   └── passport.config.ts
│   ├── entities/            # Entidades TypeORM (Classes com Decorators)
│   │   ├── User.entity.ts
│   │   ├── Course.entity.ts
│   │   ├── Module.entity.ts
│   │   ├── Lesson.entity.ts
│   │   ├── Purchase.entity.ts
│   │   ├── PurchaseCourse.entity.ts
│   │   ├── Progress.entity.ts
│   │   ├── Coupon.entity.ts
│   │   ├── CouponCourse.entity.ts
│   │   ├── Review.entity.ts
│   │   └── CartItem.entity.ts
│   ├── dto/                 # Data Transfer Objects (Classes de Validação)
│   │   ├── auth.dto.ts
│   │   ├── course.dto.ts
│   │   ├── purchase.dto.ts
│   │   └── ...
│   ├── controllers/         # Controllers (Classes com Decorators)
│   │   ├── AuthController.ts
│   │   ├── CourseController.ts
│   │   ├── PurchaseController.ts
│   │   ├── ProgressController.ts
│   │   ├── AdminController.ts
│   │   ├── CouponController.ts
│   │   └── ReviewController.ts
│   ├── services/            # Serviços (Classes de Negócio)
│   │   ├── AuthService.ts
│   │   ├── CourseService.ts
│   │   ├── PurchaseService.ts
│   │   ├── PaymentService.ts
│   │   ├── GoogleAuthService.ts
│   │   └── ...
│   ├── repositories/        # Repositórios Customizados (Opcional)
│   │   └── ...
│   ├── middleware/          # Middlewares (Classes)
│   │   ├── AuthMiddleware.ts
│   │   ├── AdminMiddleware.ts
│   │   └── ValidationMiddleware.ts
│   ├── decorators/          # Decorators Customizados
│   │   ├── Roles.decorator.ts
│   │   └── CurrentUser.decorator.ts
│   ├── guards/              # Guards (NestJS-style ou Express)
│   │   ├── AuthGuard.ts
│   │   └── RolesGuard.ts
│   ├── strategies/          # Passport Strategies
│   │   ├── google.strategy.ts
│   │   └── jwt.strategy.ts
│   ├── utils/               # Utilitários
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── migrations/          # Migrations TypeORM
│   │   └── ...
│   └── app.ts               # Aplicação principal
├── tests/                    # Testes
├── .env.example
├── package.json
├── tsconfig.json
└── ormconfig.ts             # Configuração TypeORM
```

## 🗄️ Entidades TypeORM (Orientadas a Objetos)

### User (Usuário)
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string; // nullable para usuários OAuth

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role: UserRole;

  // Campos para OAuth Google
  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Purchase, purchase => purchase.user)
  purchases: Purchase[];

  @OneToMany(() => Progress, progress => progress.user)
  progress: Progress[];

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];

  @OneToMany(() => CartItem, cartItem => cartItem.user)
  cartItems: CartItem[];

  @OneToMany(() => Certificate, certificate => certificate.user)
  certificates: Certificate[];

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => UserNotification, notification => notification.user)
  notifications: UserNotification[];

  @OneToMany(() => Refund, refund => refund.user)
  refunds: Refund[];
}
```

### Course (Curso)
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Module } from './Module.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  subtitle: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column()
  category: string;

  @Column()
  image: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column()
  instructor: string;

  @Column()
  duration: string;

  @Column()
  lessons: number;

  @Column({ default: 0 })
  students: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column('text', { nullable: true })
  aboutCourse: string;

  @Column('simple-array', { nullable: true })
  benefits: string[];

  @Column('simple-array', { nullable: true })
  bonuses: string[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Module, module => module.course, { cascade: true })
  modules: Module[];

  @OneToMany(() => PurchaseCourse, purchaseCourse => purchaseCourse.course)
  purchaseCourses: PurchaseCourse[];

  @OneToMany(() => Review, review => review.course)
  reviews: Review[];

  @OneToMany(() => Progress, progress => progress.course)
  progress: Progress[];

  @ManyToMany(() => Coupon, coupon => coupon.applicableCourses)
  @JoinTable({ name: 'coupon_courses' })
  coupons: Coupon[];

  @OneToMany(() => Certificate, certificate => certificate.course)
  certificates: Certificate[];

  @OneToMany(() => Favorite, favorite => favorite.course)
  favorites: Favorite[];
}
```

### Module (Módulo)
```typescript
{
  id: string (UUID)
  courseId: string
  title: string
  duration: string
  order: number
  lessons: Lesson[]
}
```

### Lesson (Aula)
```typescript
{
  id: string (UUID)
  moduleId: string
  title: string
  duration: string
  videoUrl: string (URL)
  order: number
  free: boolean
}
```

### Purchase (Compra)
```typescript
{
  id: string (UUID)
  userId: string
  courses: Course[] (array de IDs)
  totalAmount: number
  paymentMethod: 'credit_card' | 'pix' | 'boleto'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentId?: string (ID do gateway de pagamento)
  couponId?: string
  discountAmount?: number
  createdAt: Date
}
```

### Progress (Progresso)
```typescript
{
  id: string (UUID)
  userId: string
  courseId: string
  lessonId: string
  completed: boolean
  watchedDuration: number (segundos)
  lastAccessed: Date
  completedAt?: Date
}
```

### Coupon (Cupom)
```typescript
{
  id: string (UUID)
  code: string (unique, uppercase)
  discount: number
  type: 'percentage' | 'fixed'
  expiresAt?: Date
  maxUses: number
  currentUses: number
  applicableCourses: string[] (array de course IDs, vazio = todos)
  active: boolean
  createdAt: Date
}
```

### Review (Avaliação)
```typescript
{
  id: string (UUID)
  courseId: string
  userId: string
  rating: number (1-5)
  comment: string
  approved: boolean
  helpful: number // contador de "útil"
  images?: string[] // URLs de imagens anexadas
  createdAt: Date
}
```

### Certificate (Certificado)
```typescript
{
  id: string (UUID)
  userId: string
  courseId: string
  certificateNumber: string (único)
  issuedAt: Date
  pdfUrl: string (URL)
  verificationCode: string (único)
  expiresAt?: Date
}
```

### Favorite (Favorito)
```typescript
{
  id: string (UUID)
  userId: string
  courseId: string
  createdAt: Date
}
```

### UserNotification (Notificação do Usuário)
```typescript
{
  id: string (UUID)
  userId: string
  type: 'purchase_confirmed' | 'course_available' | 'certificate_ready' | 'new_content' | 'reminder'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: Date
}
```

## 🔌 Endpoints da API

### Autenticação (`/api/auth`)

#### POST `/api/auth/register`
Registrar novo usuário (email/senha)
```json
Request Body:
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}

Response:
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "student"
  },
  "token": "jwt_token"
}
```

#### POST `/api/auth/login`
Login de usuário (email/senha)
```json
Request Body:
{
  "email": "joao@email.com",
  "password": "senha123"
}

Response:
{
  "user": { ... },
  "token": "jwt_token"
}
```

#### GET `/api/auth/google`
Iniciar autenticação Google OAuth
- Redireciona para Google OAuth consent screen

#### GET `/api/auth/google/callback`
Callback do Google OAuth
- Processa o código de autorização
- Cria ou atualiza usuário
- Retorna token JWT

Response:
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@gmail.com",
    "avatar": "https://...",
    "role": "student"
  },
  "token": "jwt_token"
}
```

#### POST `/api/auth/logout`
Logout (invalidar token)

#### GET `/api/auth/me`
Obter dados do usuário autenticado

#### PUT `/api/auth/profile` (Autenticado)
Atualizar perfil do usuário
```json
Request Body:
{
  "name": "João Silva",
  "avatar": "https://..." (opcional)
}

Response:
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "avatar": "https://...",
    ...
  }
}
```

#### PUT `/api/auth/change-password` (Autenticado)
Alterar senha
```json
Request Body:
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha123"
}

Response:
{
  "message": "Senha alterada com sucesso"
}
```

#### POST `/api/auth/forgot-password`
Solicitar recuperação de senha
```json
Request Body:
{
  "email": "joao@email.com"
}

Response:
{
  "message": "Email de recuperação enviado"
}
```

#### POST `/api/auth/reset-password`
Redefinir senha com token
```json
Request Body:
{
  "token": "reset_token",
  "newPassword": "nova_senha123"
}

Response:
{
  "message": "Senha redefinida com sucesso"
}
```

---

### Cursos (`/api/courses`)

#### GET `/api/courses`
Listar todos os cursos (público)
```json
Query Params:
- category?: string
- search?: string
- page?: number
- limit?: number

Response:
{
  "courses": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### GET `/api/courses/:id`
Obter detalhes de um curso (público)
```json
Response:
{
  "course": { ... },
  "modules": [...],
  "reviews": [...],
  "isPurchased": false, // se usuário autenticado tem acesso
  "isInCart": false, // se está no carrinho do usuário
  "isFavorite": false // se está nos favoritos do usuário
}
```

#### GET `/api/courses/search` (Público)
Busca avançada de cursos
```json
Query Params:
- q?: string (termo de busca)
- category?: string
- minPrice?: number
- maxPrice?: number
- minRating?: number
- instructor?: string
- sortBy?: 'price' | 'rating' | 'students' | 'createdAt'
- sortOrder?: 'asc' | 'desc'
- page?: number
- limit?: number

Response:
{
  "courses": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "filters": {
    "categories": ["Relacionamentos", "Ansiedade", ...],
    "priceRange": { "min": 0, "max": 1000 },
    "instructors": ["Dr. João", "Dra. Maria", ...]
  }
}
```

#### GET `/api/courses/:id/related` (Público)
Cursos relacionados/recomendados
```json
Response:
{
  "courses": [
    {
      "id": "uuid",
      "title": "...",
      "price": 297.00,
      "image": "...",
      "similarity": 0.85
    }
  ]
}
```

#### POST `/api/courses/:id/share` (Público)
Gerar link de compartilhamento
```json
Response:
{
  "shareUrl": "https://seu-site.com/cursos/uuid?ref=share_token",
  "shareToken": "share_token",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### POST `/api/courses` (Admin)
Criar novo curso
```json
Request Body:
{
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "price": 297.00,
  ...
}
```

#### PUT `/api/courses/:id` (Admin)
Atualizar curso

#### DELETE `/api/courses/:id` (Admin)
Deletar curso

#### POST `/api/courses/:courseId/modules` (Admin)
Criar módulo em um curso
```json
Request Body:
{
  "title": "Módulo 1: Fundamentos",
  "duration": "4h 30min",
  "order": 1
}

Response:
{
  "module": {
    "id": "uuid",
    "courseId": "uuid",
    "title": "Módulo 1: Fundamentos",
    "duration": "4h 30min",
    "order": 1,
    "lessons": []
  }
}
```

#### PUT `/api/courses/:courseId/modules/:moduleId` (Admin)
Atualizar módulo
```json
Request Body:
{
  "title": "Módulo 1: Fundamentos Atualizado",
  "duration": "5h",
  "order": 1
}
```

#### DELETE `/api/courses/:courseId/modules/:moduleId` (Admin)
Deletar módulo

#### GET `/api/courses/:courseId/modules` (Público)
Listar módulos de um curso
```json
Response:
{
  "modules": [
    {
      "id": "uuid",
      "title": "Módulo 1: Fundamentos",
      "duration": "4h 30min",
      "order": 1,
      "lessons": [...]
    }
  ]
}
```

#### POST `/api/modules/:moduleId/lessons` (Admin)
Criar aula em um módulo
```json
Request Body:
{
  "title": "Introdução à Psicologia",
  "duration": "45min",
  "videoUrl": "https://...",
  "order": 1,
  "free": false
}

Response:
{
  "lesson": {
    "id": "uuid",
    "moduleId": "uuid",
    "title": "Introdução à Psicologia",
    "duration": "45min",
    "videoUrl": "https://...",
    "order": 1,
    "free": false
  }
}
```

#### PUT `/api/modules/:moduleId/lessons/:lessonId` (Admin)
Atualizar aula
```json
Request Body:
{
  "title": "Introdução à Psicologia Atualizada",
  "duration": "50min",
  "videoUrl": "https://...",
  "order": 1,
  "free": false
}
```

#### DELETE `/api/modules/:moduleId/lessons/:lessonId` (Admin)
Deletar aula

#### GET `/api/modules/:moduleId/lessons` (Público)
Listar aulas de um módulo
```json
Response:
{
  "lessons": [
    {
      "id": "uuid",
      "title": "Introdução à Psicologia",
      "duration": "45min",
      "videoUrl": "https://...",
      "order": 1,
      "free": false
    }
  ]
}
```

#### GET `/api/lessons/:lessonId` (Autenticado)
Obter detalhes de uma aula (verificar se usuário tem acesso)
```json
Response:
{
  "lesson": {
    "id": "uuid",
    "title": "Introdução à Psicologia",
    "duration": "45min",
    "videoUrl": "https://...",
    "order": 1,
    "free": false,
    "module": {
      "id": "uuid",
      "title": "Módulo 1",
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia"
      }
    }
  },
  "hasAccess": true,
  "progress": {
    "completed": false,
    "watchedDuration": 0
  }
}
```

---

### Compras (`/api/purchases`)

#### POST `/api/purchases/checkout`
Iniciar processo de checkout
```json
Request Body:
{
  "courses": ["course-id-1", "course-id-2"],
  "couponCode": "DESCONTO20" (opcional),
  "paymentMethod": "credit_card" | "pix" | "boleto"
}

Response:
{
  "purchaseId": "uuid",
  "totalAmount": 594.00,
  "discountAmount": 0,
  "finalAmount": 594.00,
  "payment": {
    "method": "pix",
    "pixCode": "..." (se PIX),
    "boletoUrl": "..." (se boleto)
  }
}
```

#### POST `/api/purchases/:id/confirm`
Confirmar pagamento
```json
Request Body:
{
  "paymentId": "gateway_payment_id",
  "paymentData": { ... } // dados específicos do gateway
}

Response:
{
  "purchase": { ... },
  "courses": [...]
}
```

#### GET `/api/purchases/my-purchases`
Listar compras do usuário autenticado

#### GET `/api/purchases/:id`
Obter detalhes de uma compra
```json
Response:
{
  "purchase": {
    "id": "uuid",
    "userId": "uuid",
    "totalAmount": 594.00,
    "discountAmount": 59.40,
    "finalAmount": 534.60,
    "paymentMethod": "pix",
    "paymentStatus": "paid",
    "paymentId": "mp_payment_id",
    "couponId": "uuid",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "courses": [
    {
      "id": "uuid",
      "title": "Curso de Psicologia",
      "price": 297.00
    }
  ],
  "coupon": {
    "code": "DESCONTO20",
    "discount": 59.40
  }
}
```

#### GET `/api/purchases/my-purchases/stats`
Estatísticas das compras do usuário
```json
Response:
{
  "totalPurchases": 5,
  "totalSpent": 1485.00,
  "coursesOwned": 5,
  "averagePurchaseValue": 297.00,
  "lastPurchase": "2025-01-15T10:00:00Z"
}
```

---

### Progresso (`/api/progress`)

#### GET `/api/progress/course/:courseId`
Obter progresso do usuário em um curso
```json
Response:
{
  "courseId": "uuid",
  "progress": 45,
  "completedLessons": ["lesson-id-1", ...],
  "lastAccessed": "2025-01-15T10:30:00Z",
  "lessons": [
    {
      "lessonId": "uuid",
      "completed": true,
      "watchedDuration": 1200
    }
  ]
}
```

#### POST `/api/progress/lesson/:lessonId/complete`
Marcar aula como concluída
```json
Request Body:
{
  "watchedDuration": 1200 // segundos
}

Response:
{
  "progress": { ... },
  "courseProgress": 45
}
```

#### PUT `/api/progress/lesson/:lessonId/watch`
Atualizar tempo assistido
```json
Request Body:
{
  "watchedDuration": 600 // segundos
}

Response:
{
  "progress": {
    "id": "uuid",
    "userId": "uuid",
    "courseId": "uuid",
    "lessonId": "uuid",
    "completed": false,
    "watchedDuration": 600,
    "lastAccessed": "2025-01-15T10:30:00Z"
  }
}
```

#### GET `/api/progress/my-courses`
Listar progresso em todos os cursos do usuário
```json
Response:
{
  "courses": [
    {
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "progress": 45,
      "completedLessons": 10,
      "totalLessons": 22,
      "lastAccessed": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### GET `/api/progress/lesson/:lessonId`
Obter progresso específico de uma aula
```json
Response:
{
  "progress": {
    "id": "uuid",
    "completed": true,
    "watchedDuration": 1200,
    "lastAccessed": "2025-01-15T10:00:00Z",
    "completedAt": "2025-01-15T10:20:00Z"
  },
  "lesson": {
    "id": "uuid",
    "title": "Introdução à Psicologia",
    "duration": "45min"
  }
}
```

#### GET `/api/progress/stats`
Estatísticas gerais de progresso do usuário
```json
Response:
{
  "totalCourses": 5,
  "coursesCompleted": 2,
  "coursesInProgress": 3,
  "totalLessons": 100,
  "lessonsCompleted": 45,
  "averageProgress": 45.0,
  "totalWatchTime": 36000, // segundos
  "streak": 5, // dias consecutivos estudando
  "lastActivity": "2025-01-15T10:00:00Z"
}
```

#### GET `/api/progress/history` (Autenticado)
Histórico de visualizações e atividades
```json
Query Params:
- page?: number
- limit?: number

Response:
{
  "history": [
    {
      "id": "uuid",
      "type": "lesson_watched" | "course_started" | "course_completed",
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "lessonId": "uuid",
      "lessonTitle": "Introdução",
      "timestamp": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 50
}
```

---

### Carrinho (`/api/cart`)

#### GET `/api/cart`
Obter itens do carrinho do usuário

#### POST `/api/cart/add`
Adicionar curso ao carrinho
```json
Request Body:
{
  "courseId": "uuid"
}
```

#### DELETE `/api/cart/remove/:courseId`
Remover curso do carrinho

#### DELETE `/api/cart/clear`
Limpar carrinho

#### GET `/api/cart/total`
Obter total do carrinho
```json
Response:
{
  "items": 2,
  "subtotal": 594.00,
  "discount": 59.40,
  "total": 534.60,
  "couponApplied": {
    "code": "DESCONTO20",
    "discount": 59.40
  }
}
```

#### POST `/api/cart/apply-coupon` (Autenticado)
Aplicar cupom ao carrinho
```json
Request Body:
{
  "couponCode": "DESCONTO20"
}

Response:
{
  "coupon": { ... },
  "discountAmount": 59.40,
  "newTotal": 534.60
}
```

#### DELETE `/api/cart/remove-coupon` (Autenticado)
Remover cupom do carrinho

---

### Cupons (`/api/coupons`)

#### GET `/api/coupons/validate/:code`
Validar cupom de desconto
```json
Query Params:
- totalAmount: number

Response:
{
  "valid": true,
  "coupon": { ... },
  "discountAmount": 59.40,
  "finalAmount": 534.60
}
```

#### GET `/api/coupons` (Admin)
Listar todos os cupons
```json
Query Params:
- page?: number
- limit?: number
- active?: boolean

Response:
{
  "coupons": [
    {
      "id": "uuid",
      "code": "DESCONTO20",
      "discount": 20,
      "type": "percentage",
      "expiresAt": "2025-12-31T23:59:59Z",
      "maxUses": 100,
      "currentUses": 15,
      "active": true,
      "applicableCourses": [],
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1
}
```

#### GET `/api/coupons/:id` (Admin)
Obter detalhes de um cupom
```json
Response:
{
  "coupon": {
    "id": "uuid",
    "code": "DESCONTO20",
    "discount": 20,
    "type": "percentage",
    "expiresAt": "2025-12-31T23:59:59Z",
    "maxUses": 100,
    "currentUses": 15,
    "active": true,
    "applicableCourses": [
      {
        "id": "course-uuid",
        "title": "Curso de Psicologia"
      }
    ],
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

#### POST `/api/coupons` (Admin)
Criar novo cupom
```json
Request Body:
{
  "code": "DESCONTO20",
  "discount": 20,
  "type": "percentage", // ou "fixed"
  "expiresAt": "2025-12-31T23:59:59Z" (opcional),
  "maxUses": 100 (opcional, padrão: ilimitado),
  "applicableCourses": ["course-id-1", "course-id-2"] (opcional, vazio = todos),
  "active": true
}

Response:
{
  "coupon": {
    "id": "uuid",
    "code": "DESCONTO20",
    ...
  }
}
```

#### PUT `/api/coupons/:id` (Admin)
Atualizar cupom
```json
Request Body:
{
  "discount": 25,
  "expiresAt": "2025-12-31T23:59:59Z",
  "maxUses": 200,
  "active": false
}
```

#### DELETE `/api/coupons/:id` (Admin)
Deletar cupom
```json
Response:
{
  "message": "Cupom deletado com sucesso"
}
```

#### PUT `/api/coupons/:id/toggle` (Admin)
Ativar/Desativar cupom
```json
Response:
{
  "coupon": {
    "id": "uuid",
    "active": false,
    ...
  }
}
```

#### GET `/api/coupons/:code/usage` (Admin)
Obter estatísticas de uso de um cupom
```json
Response:
{
  "coupon": { ... },
  "usage": {
    "totalUses": 15,
    "remainingUses": 85,
    "totalDiscountGiven": 2970.00,
    "purchases": [
      {
        "id": "purchase-uuid",
        "userName": "João Silva",
        "discountAmount": 59.40,
        "date": "2025-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### Admin (`/api/admin`)

#### GET `/api/admin/dashboard`
Estatísticas completas do dashboard
```json
Query Params:
- period?: 'day' | 'week' | 'month' | 'year' (padrão: 'month')
- startDate?: string (ISO date)
- endDate?: string (ISO date)

Response:
{
  "summary": {
    "totalRevenue": 50000.00,
    "totalSales": 150,
    "totalStudents": 120,
    "totalCourses": 6,
    "averageTicket": 333.33,
    "conversionRate": 12.5, // %
    "activeStudents": 95,
    "completedCourses": 45
  },
  "charts": {
    "salesByDay": [
      {
        "date": "2025-01-15",
        "sales": 5,
        "revenue": 1485.00
      },
      {
        "date": "2025-01-16",
        "sales": 8,
        "revenue": 2376.00
      }
    ],
    "revenueByCourse": [
      {
        "courseId": "uuid",
        "courseTitle": "Curso de Psicologia",
        "sales": 50,
        "revenue": 14850.00,
        "percentage": 29.7
      }
    ],
    "salesByPaymentMethod": [
      {
        "method": "pix",
        "count": 80,
        "revenue": 23760.00,
        "percentage": 53.3
      },
      {
        "method": "credit_card",
        "count": 50,
        "revenue": 14850.00,
        "percentage": 33.3
      },
      {
        "method": "boleto",
        "count": 20,
        "revenue": 5940.00,
        "percentage": 13.3
      }
    ],
    "studentGrowth": [
      {
        "date": "2025-01-01",
        "total": 100
      },
      {
        "date": "2025-01-15",
        "total": 120
      }
    ],
    "coursePerformance": [
      {
        "courseId": "uuid",
        "courseTitle": "Curso de Psicologia",
        "students": 50,
        "completionRate": 75.5,
        "averageRating": 4.8,
        "revenue": 14850.00
      }
    ],
    "topStudents": [
      {
        "userId": "uuid",
        "userName": "João Silva",
        "coursesCompleted": 5,
        "totalProgress": 85.5,
        "lastActivity": "2025-01-15T10:00:00Z"
      }
    ]
  },
  "recentActivity": {
    "recentPurchases": [...],
    "recentStudents": [...],
    "recentReviews": [...]
  }
}
```

#### GET `/api/admin/dashboard/sales-chart`
Gráfico de vendas (dados para gráfico de linha)
```json
Query Params:
- period: 'day' | 'week' | 'month' | 'year'
- startDate?: string
- endDate?: string

Response:
{
  "labels": ["Jan", "Fev", "Mar", "Abr"],
  "datasets": [
    {
      "label": "Vendas",
      "data": [10, 15, 20, 25],
      "borderColor": "#3b82f6"
    },
    {
      "label": "Receita (R$)",
      "data": [2970, 4455, 5940, 7425],
      "borderColor": "#14b8a6"
    }
  ]
}
```

#### GET `/api/admin/dashboard/revenue-chart`
Gráfico de receita por curso (dados para gráfico de pizza/bar)
```json
Response:
{
  "labels": ["Curso 1", "Curso 2", "Curso 3"],
  "datasets": [
    {
      "label": "Receita (R$)",
      "data": [14850, 11880, 8910],
      "backgroundColor": ["#3b82f6", "#14b8a6", "#8b5cf6"]
    }
  ],
  "total": 35640.00
}
```

#### GET `/api/admin/dashboard/students-chart`
Gráfico de crescimento de alunos
```json
Query Params:
- period: 'day' | 'week' | 'month' | 'year'

Response:
{
  "labels": ["Jan", "Fev", "Mar", "Abr"],
  "datasets": [
    {
      "label": "Novos Alunos",
      "data": [10, 15, 20, 25],
      "borderColor": "#3b82f6",
      "fill": true
    },
    {
      "label": "Total de Alunos",
      "data": [100, 115, 135, 160],
      "borderColor": "#14b8a6",
      "fill": false
    }
  ]
}
```

#### GET `/api/admin/dashboard/payment-methods-chart`
Gráfico de métodos de pagamento
```json
Response:
{
  "labels": ["PIX", "Cartão de Crédito", "Boleto"],
  "datasets": [
    {
      "data": [80, 50, 20],
      "backgroundColor": ["#3b82f6", "#14b8a6", "#8b5cf6"]
    }
  ],
  "total": 150
}
```

#### GET `/api/admin/students`
Listar todos os alunos
```json
Query Params:
- page?: number
- limit?: number
- search?: string

Response:
{
  "students": [...],
  "total": 120,
  "page": 1
}
```

#### GET `/api/admin/purchases`
Listar todas as compras
```json
Query Params:
- page?: number
- limit?: number
- startDate?: string
- endDate?: string

Response:
{
  "purchases": [...],
  "total": 150
}
```

#### GET `/api/admin/revenue`
Análise detalhada de faturamento
```json
Query Params:
- period?: 'day' | 'week' | 'month' | 'year'
- startDate?: string
- endDate?: string

Response:
{
  "summary": {
    "totalRevenue": 50000.00,
    "totalSales": 150,
    "averageTicket": 333.33,
    "growth": 15.5, // % de crescimento
    "refunds": 500.00,
    "netRevenue": 49500.00
  },
  "revenueByCourse": [
    {
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "sales": 50,
      "revenue": 14850.00,
      "percentage": 29.7,
      "averagePrice": 297.00
    }
  ],
  "revenueByPeriod": [
    {
      "period": "2025-01",
      "revenue": 15000.00,
      "sales": 50
    },
    {
      "period": "2025-02",
      "revenue": 20000.00,
      "sales": 67
    }
  ],
  "revenueByPaymentMethod": [
    {
      "method": "pix",
      "revenue": 23760.00,
      "percentage": 47.5
    },
    {
      "method": "credit_card",
      "revenue": 14850.00,
      "percentage": 29.7
    },
    {
      "method": "boleto",
      "revenue": 11390.00,
      "percentage": 22.8
    }
  ],
  "topSellingCourses": [
    {
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "sales": 50,
      "revenue": 14850.00
    }
  ]
}
```

#### GET `/api/admin/analytics/overview`
Visão geral de analytics
```json
Response:
{
  "metrics": {
    "totalRevenue": 50000.00,
    "totalStudents": 120,
    "totalCourses": 6,
    "averageCourseRating": 4.8,
    "averageCompletionRate": 65.5,
    "studentRetentionRate": 78.3
  },
  "trends": {
    "revenueTrend": "up", // "up" | "down" | "stable"
    "studentGrowthTrend": "up",
    "salesTrend": "up"
  },
  "comparisons": {
    "revenueVsLastPeriod": {
      "current": 50000.00,
      "previous": 43000.00,
      "change": 16.3
    },
    "studentsVsLastPeriod": {
      "current": 120,
      "previous": 100,
      "change": 20.0
    }
  }
}
```

#### GET `/api/admin/analytics/student-progress`
Análise de progresso dos alunos
```json
Response:
{
  "overallProgress": {
    "averageProgress": 65.5,
    "studentsCompleted": 45,
    "studentsInProgress": 60,
    "studentsNotStarted": 15
  },
  "progressByCourse": [
    {
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "averageProgress": 75.5,
      "studentsCompleted": 30,
      "studentsInProgress": 20
    }
  ],
  "topPerformers": [
    {
      "userId": "uuid",
      "userName": "João Silva",
      "coursesCompleted": 5,
      "averageProgress": 95.5
    }
  ]
}
```

#### POST `/api/admin/export/purchases` (Admin)
Exportar compras para CSV/Excel
```json
Query Params:
- format?: 'csv' | 'xlsx'
- startDate?: string
- endDate?: string

Response:
- Arquivo CSV/XLSX para download
```

#### POST `/api/admin/export/students` (Admin)
Exportar alunos para CSV/Excel
```json
Query Params:
- format?: 'csv' | 'xlsx'

Response:
- Arquivo CSV/XLSX para download
```

#### POST `/api/admin/export/courses` (Admin)
Exportar cursos para CSV/Excel
```json
Query Params:
- format?: 'csv' | 'xlsx'

Response:
- Arquivo CSV/XLSX para download
```

#### POST `/api/admin/courses/:courseId/upload-video` (Admin)
Upload de vídeo para uma aula
```json
Request:
- Multipart form-data
- file: File (vídeo)
- lessonId: string

Response:
{
  "videoUrl": "https://storage.../video.mp4",
  "thumbnailUrl": "https://storage.../thumbnail.jpg",
  "duration": 2700 // segundos
}
```

#### POST `/api/admin/courses/:courseId/upload-image` (Admin)
Upload de imagem para curso
```json
Request:
- Multipart form-data
- file: File (imagem)

Response:
{
  "imageUrl": "https://storage.../image.jpg"
}
```

#### POST `/api/admin/courses/:courseId/upload-material` (Admin)
Upload de material de apoio
```json
Request:
- Multipart form-data
- file: File (PDF, DOC, etc.)
- title: string
- description?: string

Response:
{
  "material": {
    "id": "uuid",
    "title": "Material de Apoio",
    "url": "https://storage.../material.pdf",
    "type": "pdf",
    "size": 1024000
  }
}
```

#### GET `/api/admin/courses/:courseId/materials` (Admin)
Listar materiais de apoio de um curso
```json
Response:
{
  "materials": [
    {
      "id": "uuid",
      "title": "Material de Apoio",
      "url": "https://storage.../material.pdf",
      "type": "pdf",
      "size": 1024000,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### DELETE `/api/admin/courses/:courseId/materials/:materialId` (Admin)
Deletar material de apoio

#### PUT `/api/admin/courses/:courseId/reorder-modules` (Admin)
Reordenar módulos de um curso
```json
Request Body:
{
  "moduleIds": ["module-id-1", "module-id-2", "module-id-3"]
}

Response:
{
  "message": "Módulos reordenados com sucesso"
}
```

#### PUT `/api/admin/modules/:moduleId/reorder-lessons` (Admin)
Reordenar aulas de um módulo
```json
Request Body:
{
  "lessonIds": ["lesson-id-1", "lesson-id-2", "lesson-id-3"]
}

Response:
{
  "message": "Aulas reordenadas com sucesso"
}
```

#### POST `/api/admin/courses/:courseId/duplicate` (Admin)
Duplicar curso
```json
Request Body:
{
  "title": "Novo Título do Curso",
  "includeContent": true,
  "includeModules": true,
  "includeLessons": true
}

Response:
{
  "course": {
    "id": "new-uuid",
    "title": "Novo Título do Curso",
    ...
  }
}
```

#### GET `/api/admin/notifications` (Admin)
Listar notificações do sistema
```json
Response:
{
  "notifications": [
    {
      "id": "uuid",
      "type": "new_purchase" | "new_review" | "payment_failed",
      "title": "Nova compra realizada",
      "message": "João Silva comprou o curso...",
      "read": false,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

#### PUT `/api/admin/notifications/:id/read` (Admin)
Marcar notificação como lida

#### PUT `/api/admin/notifications/read-all` (Admin)
Marcar todas as notificações como lidas

---

### Certificados (`/api/certificates`)

#### GET `/api/certificates/my-certificates` (Autenticado)
Listar certificados do usuário
```json
Response:
{
  "certificates": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "certificateNumber": "CERT-2025-001234",
      "issuedAt": "2025-01-15T10:00:00Z",
      "pdfUrl": "https://storage.../certificate.pdf",
      "verificationCode": "ABC123XYZ"
    }
  ]
}
```

#### GET `/api/certificates/:id` (Autenticado)
Obter certificado específico
```json
Response:
{
  "certificate": {
    "id": "uuid",
    "course": {
      "id": "uuid",
      "title": "Curso de Psicologia",
      "instructor": "Dr. João"
    },
    "user": {
      "name": "João Silva"
    },
    "certificateNumber": "CERT-2025-001234",
    "issuedAt": "2025-01-15T10:00:00Z",
    "pdfUrl": "https://storage.../certificate.pdf",
    "verificationCode": "ABC123XYZ"
  }
}
```

#### GET `/api/certificates/:id/download` (Autenticado)
Download do PDF do certificado
- Retorna arquivo PDF para download

#### GET `/api/certificates/verify/:code` (Público)
Verificar autenticidade de certificado
```json
Response:
{
  "valid": true,
  "certificate": {
    "certificateNumber": "CERT-2025-001234",
    "courseTitle": "Curso de Psicologia",
    "userName": "João Silva",
    "issuedAt": "2025-01-15T10:00:00Z"
  }
}
```

#### POST `/api/certificates/generate/:courseId` (Autenticado)
Gerar certificado ao concluir curso
```json
Response:
{
  "certificate": {
    "id": "uuid",
    "certificateNumber": "CERT-2025-001234",
    "pdfUrl": "https://storage.../certificate.pdf",
    ...
  }
}
```

---

### Favoritos (`/api/favorites`)

#### GET `/api/favorites` (Autenticado)
Listar cursos favoritos
```json
Response:
{
  "favorites": [
    {
      "id": "uuid",
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia",
        "price": 297.00,
        "image": "...",
        ...
      },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### POST `/api/favorites/:courseId` (Autenticado)
Adicionar curso aos favoritos
```json
Response:
{
  "favorite": {
    "id": "uuid",
    "courseId": "uuid",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

#### DELETE `/api/favorites/:courseId` (Autenticado)
Remover dos favoritos

#### GET `/api/favorites/check/:courseId` (Autenticado)
Verificar se curso está nos favoritos
```json
Response:
{
  "isFavorite": true,
  "favoriteId": "uuid"
}
```

---

### Notificações do Usuário (`/api/notifications`)

#### GET `/api/notifications` (Autenticado)
Listar notificações do usuário
```json
Query Params:
- unreadOnly?: boolean
- page?: number
- limit?: number

Response:
{
  "notifications": [
    {
      "id": "uuid",
      "type": "purchase_confirmed",
      "title": "Compra confirmada!",
      "message": "Seu pagamento foi confirmado. Acesso liberado!",
      "read": false,
      "link": "/meus-cursos",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "total": 20
}
```

#### PUT `/api/notifications/:id/read` (Autenticado)
Marcar notificação como lida

#### PUT `/api/notifications/read-all` (Autenticado)
Marcar todas como lidas

#### DELETE `/api/notifications/:id` (Autenticado)
Deletar notificação

---

### Recomendações (`/api/recommendations`)

#### GET `/api/recommendations` (Autenticado)
Obter recomendações personalizadas
```json
Query Params:
- limit?: number (padrão: 5)

Response:
{
  "recommendations": [
    {
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia",
        "price": 297.00,
        ...
      },
      "reason": "Baseado nos seus cursos anteriores",
      "score": 0.85
    }
  ]
}
```

#### GET `/api/recommendations/trending` (Público)
Cursos em alta/trending
```json
Response:
{
  "courses": [
    {
      "id": "uuid",
      "title": "...",
      "trendingScore": 95.5,
      "salesLast7Days": 50,
      ...
    }
  ]
}
```

---

### Garantia e Reembolso (`/api/refunds`)

#### POST `/api/refunds/request` (Autenticado)
Solicitar reembolso (garantia de 7 dias)
```json
Request Body:
{
  "purchaseId": "uuid",
  "reason": "Não atendeu minhas expectativas",
  "comment": "..."
}

Response:
{
  "refund": {
    "id": "uuid",
    "purchaseId": "uuid",
    "amount": 297.00,
    "status": "pending",
    "requestedAt": "2025-01-15T10:00:00Z"
  }
}
```

#### GET `/api/refunds/my-refunds` (Autenticado)
Listar reembolsos do usuário

#### GET `/api/refunds` (Admin)
Listar todas as solicitações de reembolso
```json
Query Params:
- status?: 'pending' | 'approved' | 'rejected'
- page?: number

Response:
{
  "refunds": [
    {
      "id": "uuid",
      "userName": "João Silva",
      "courseTitle": "Curso de Psicologia",
      "amount": 297.00,
      "status": "pending",
      "reason": "...",
      "requestedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 10
}
```

#### PUT `/api/refunds/:id/approve` (Admin)
Aprovar reembolso
```json
Response:
{
  "refund": {
    "id": "uuid",
    "status": "approved",
    "processedAt": "2025-01-15T10:00:00Z"
  }
}
```

#### PUT `/api/refunds/:id/reject` (Admin)
Rejeitar reembolso
```json
Request Body:
{
  "reason": "Fora do prazo de garantia"
}
```

---

### Avaliações (`/api/reviews`)

#### GET `/api/reviews/course/:courseId`
Listar avaliações de um curso
```json
Response:
{
  "reviews": [...],
  "averageRating": 4.8,
  "totalReviews": 50
}
```

#### POST `/api/reviews`
Criar nova avaliação
```json
Request Body:
{
  "courseId": "uuid",
  "rating": 5,
  "comment": "Excelente curso!"
}
```

#### GET `/api/reviews` (Admin)
Listar todas as avaliações (pendentes e aprovadas)

#### PUT `/api/reviews/:id/approve` (Admin)
Aprovar avaliação

#### DELETE `/api/reviews/:id` (Admin)
Deletar avaliação

#### GET `/api/reviews/pending` (Admin)
Listar avaliações pendentes de aprovação
```json
Response:
{
  "reviews": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "userId": "uuid",
      "userName": "João Silva",
      "rating": 5,
      "comment": "Excelente curso!",
      "approved": false,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 5
}
```

#### GET `/api/reviews/stats` (Admin)
Estatísticas de avaliações
```json
Response:
{
  "totalReviews": 150,
  "pendingReviews": 5,
  "approvedReviews": 145,
  "averageRating": 4.8,
  "ratingDistribution": {
    "5": 90,
    "4": 40,
    "3": 15,
    "2": 3,
    "1": 2
  },
  "reviewsByCourse": [
    {
      "courseId": "uuid",
      "courseTitle": "Curso de Psicologia",
      "totalReviews": 50,
      "averageRating": 4.9
    }
  ]
}
```

#### POST `/api/reviews/:id/helpful` (Autenticado)
Marcar avaliação como útil
```json
Response:
{
  "review": {
    "id": "uuid",
    "helpful": 5,
    ...
  }
}
```

#### POST `/api/reviews/:id/images` (Autenticado)
Anexar imagens à avaliação
```json
Request:
- Multipart form-data
- files: File[] (imagens)

Response:
{
  "review": {
    "id": "uuid",
    "images": ["https://storage.../img1.jpg", ...],
    ...
  }
}
```

---

## 🔐 Autenticação

### JWT (JSON Web Tokens)
- Token expira em 7 dias
- Refresh token para renovação
- Middleware de autenticação em rotas protegidas
- Middleware de admin para rotas administrativas

### Google OAuth 2.0
- **Passport.js** com estratégia `passport-google-oauth20`
- Fluxo OAuth completo:
  1. Usuário clica em "Login com Google"
  2. Redireciona para `/api/auth/google`
  3. Google autentica e retorna para `/api/auth/google/callback`
  4. Sistema cria/atualiza usuário com dados do Google
  5. Retorna JWT token para o frontend

### Configuração Google OAuth
1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google+ API
3. Criar OAuth 2.0 Credentials
4. Configurar Redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (dev)
   - `https://seu-dominio.com/api/auth/google/callback` (prod)
5. Adicionar variáveis de ambiente:
   ```env
   GOOGLE_CLIENT_ID=seu_client_id
   GOOGLE_CLIENT_SECRET=seu_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   ```

## 💳 Integração de Pagamentos

### Mercado Pago (Recomendado para Brasil)
- **Cartão de Crédito**: Usar Checkout Pro ou API de pagamentos
- **PIX**: Gerar QR Code dinâmico
- **Boleto**: Gerar boleto bancário

### Webhooks
- Configurar webhooks para atualizar status de pagamento
- Endpoint: `POST /api/webhooks/mercadopago`

## 📊 Banco de Dados

### Relacionamentos
- User 1:N Purchase
- User 1:N Progress
- User 1:N Review
- Course 1:N Module
- Module 1:N Lesson
- Course N:M Purchase (many-to-many)
- Purchase N:1 Coupon (opcional)

### Índices Recomendados
- `users.email` (unique)
- `courses.category`
- `purchases.userId`
- `purchases.paymentStatus`
- `progress.userId`
- `progress.courseId`
- `coupons.code` (unique)

## 🚀 Deploy

### Variáveis de Ambiente
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=tb_psico
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Payment Gateway (Mercado Pago)
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token
MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

## 📝 Exemplos de Implementação

### Exemplo: Entidade User com TypeORM
```typescript
// src/entities/User.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Purchase } from './Purchase.entity';
import { Progress } from './Progress.entity';
import { Review } from './Review.entity';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role: UserRole;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Purchase, purchase => purchase.user)
  purchases: Purchase[];

  @OneToMany(() => Progress, progress => progress.user)
  progress: Progress[];

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];
}
```

### Exemplo: Controller com Decorators
```typescript
// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import { Post, Get, Body, Controller, UseGuards } from '@nestjs/common'; // ou criar decorators customizados
import { AuthService } from '../services/AuthService';
import { RegisterDto } from '../dto/auth.dto';
import { AuthGuard } from '../guards/AuthGuard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('google')
  async googleAuth() {
    // Redireciona para Google OAuth
  }

  @Get('google/callback')
  async googleCallback(req: Request, res: Response) {
    const user = await this.authService.googleLogin(req.user);
    // Retorna token ou redireciona para frontend
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: User) {
    return user;
  }
}
```

### Exemplo: Service com TypeORM Repository
```typescript
// src/services/AuthService.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/User.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.STUDENT
    });

    await this.userRepository.save(user);

    const token = this.generateToken(user);
    
    return { user: this.sanitizeUser(user), token };
  }

  async googleLogin(googleProfile: any) {
    let user = await this.userRepository.findOne({
      where: { googleId: googleProfile.id }
    });

    if (!user) {
      user = await this.userRepository.findOne({
        where: { email: googleProfile.emails[0].value }
      });

      if (user) {
        // Atualizar usuário existente com Google ID
        user.googleId = googleProfile.id;
        user.avatar = googleProfile.photos[0].value;
        user.emailVerified = true;
      } else {
        // Criar novo usuário
        user = this.userRepository.create({
          name: googleProfile.displayName,
          email: googleProfile.emails[0].value,
          googleId: googleProfile.id,
          avatar: googleProfile.photos[0].value,
          emailVerified: true,
          role: UserRole.STUDENT
        });
      }

      await this.userRepository.save(user);
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

### Exemplo: Google OAuth Strategy (Passport)
```typescript
// src/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../services/AuthService';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      id: profile.id,
      email: emails[0].value,
      name: name.givenName + ' ' + name.familyName,
      avatar: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}
```

## 📊 Resumo Completo de Endpoints

### ✅ Autenticação (6 endpoints)
- POST `/api/auth/register` - Registro email/senha
- POST `/api/auth/login` - Login email/senha
- GET `/api/auth/google` - Iniciar OAuth Google
- GET `/api/auth/google/callback` - Callback OAuth Google
- GET `/api/auth/me` - Obter usuário autenticado
- POST `/api/auth/logout` - Logout

### ✅ Cursos (11 endpoints)
- GET `/api/courses` - Listar cursos
- GET `/api/courses/:id` - Detalhes do curso
- POST `/api/courses` - Criar curso (Admin)
- PUT `/api/courses/:id` - Atualizar curso (Admin)
- DELETE `/api/courses/:id` - Deletar curso (Admin)
- POST `/api/courses/:courseId/modules` - Criar módulo (Admin)
- PUT `/api/courses/:courseId/modules/:moduleId` - Atualizar módulo (Admin)
- DELETE `/api/courses/:courseId/modules/:moduleId` - Deletar módulo (Admin)
- GET `/api/courses/:courseId/modules` - Listar módulos
- POST `/api/admin/courses/:courseId/upload-video` - Upload vídeo (Admin)
- POST `/api/admin/courses/:courseId/upload-image` - Upload imagem (Admin)

### ✅ Módulos e Aulas (7 endpoints)
- POST `/api/modules/:moduleId/lessons` - Criar aula (Admin)
- PUT `/api/modules/:moduleId/lessons/:lessonId` - Atualizar aula (Admin)
- DELETE `/api/modules/:moduleId/lessons/:lessonId` - Deletar aula (Admin)
- GET `/api/modules/:moduleId/lessons` - Listar aulas
- GET `/api/lessons/:lessonId` - Detalhes da aula
- PUT `/api/admin/modules/:moduleId/reorder-lessons` - Reordenar aulas (Admin)
- PUT `/api/admin/courses/:courseId/reorder-modules` - Reordenar módulos (Admin)

### ✅ Compras (5 endpoints)
- POST `/api/purchases/checkout` - Iniciar checkout
- POST `/api/purchases/:id/confirm` - Confirmar pagamento
- GET `/api/purchases/my-purchases` - Minhas compras
- GET `/api/purchases/:id` - Detalhes da compra
- GET `/api/purchases/my-purchases/stats` - Estatísticas de compras

### ✅ Progresso (5 endpoints)
- GET `/api/progress/course/:courseId` - Progresso no curso
- POST `/api/progress/lesson/:lessonId/complete` - Marcar aula concluída
- PUT `/api/progress/lesson/:lessonId/watch` - Atualizar tempo assistido
- GET `/api/progress/my-courses` - Progresso em todos os cursos
- GET `/api/progress/stats` - Estatísticas de progresso

### ✅ Carrinho (5 endpoints)
- GET `/api/cart` - Obter carrinho
- POST `/api/cart/add` - Adicionar ao carrinho
- DELETE `/api/cart/remove/:courseId` - Remover do carrinho
- DELETE `/api/cart/clear` - Limpar carrinho
- GET `/api/cart/total` - Total do carrinho

### ✅ Cupons (8 endpoints)
- GET `/api/coupons/validate/:code` - Validar cupom
- GET `/api/coupons` - Listar cupons (Admin)
- GET `/api/coupons/:id` - Detalhes do cupom (Admin)
- POST `/api/coupons` - Criar cupom (Admin)
- PUT `/api/coupons/:id` - Atualizar cupom (Admin)
- DELETE `/api/coupons/:id` - Deletar cupom (Admin)
- GET `/api/coupons/:code/usage` - Estatísticas de uso (Admin)
- PUT `/api/coupons/:id/toggle` - Ativar/Desativar (Admin)

### ✅ Avaliações (7 endpoints)
- GET `/api/reviews/course/:courseId` - Avaliações do curso
- POST `/api/reviews` - Criar avaliação
- GET `/api/reviews` - Listar todas (Admin)
- PUT `/api/reviews/:id/approve` - Aprovar (Admin)
- DELETE `/api/reviews/:id` - Deletar (Admin)
- GET `/api/reviews/pending` - Pendentes (Admin)
- GET `/api/reviews/stats` - Estatísticas (Admin)

### ✅ Admin Dashboard e Gráficos (13 endpoints)
- GET `/api/admin/dashboard` - Dashboard completo com todos os gráficos
- GET `/api/admin/dashboard/sales-chart` - Gráfico de vendas (linha)
- GET `/api/admin/dashboard/revenue-chart` - Gráfico de receita (pizza/bar)
- GET `/api/admin/dashboard/students-chart` - Gráfico de alunos (linha)
- GET `/api/admin/dashboard/payment-methods-chart` - Gráfico métodos pagamento (pizza)
- GET `/api/admin/students` - Listar alunos
- GET `/api/admin/purchases` - Listar compras
- GET `/api/admin/revenue` - Análise detalhada de faturamento
- GET `/api/admin/analytics/overview` - Visão geral analytics
- GET `/api/admin/analytics/student-progress` - Progresso dos alunos
- POST `/api/admin/export/purchases` - Exportar compras (CSV/XLSX)
- POST `/api/admin/export/students` - Exportar alunos (CSV/XLSX)
- POST `/api/admin/export/courses` - Exportar cursos (CSV/XLSX)

### ✅ Uploads e Materiais (5 endpoints)
- POST `/api/admin/courses/:courseId/upload-video` - Upload vídeo
- POST `/api/admin/courses/:courseId/upload-image` - Upload imagem
- POST `/api/admin/courses/:courseId/upload-material` - Upload material
- GET `/api/admin/courses/:courseId/materials` - Listar materiais
- DELETE `/api/admin/courses/:courseId/materials/:materialId` - Deletar material

### ✅ Utilitários Admin (4 endpoints)
- POST `/api/admin/courses/:courseId/duplicate` - Duplicar curso
- GET `/api/admin/notifications` - Notificações
- PUT `/api/admin/notifications/:id/read` - Marcar como lida
- PUT `/api/admin/notifications/read-all` - Marcar todas como lidas

### ✅ Perfil e Configurações (4 endpoints)
- PUT `/api/auth/profile` - Atualizar perfil
- PUT `/api/auth/change-password` - Alterar senha
- POST `/api/auth/forgot-password` - Recuperar senha
- POST `/api/auth/reset-password` - Redefinir senha

### ✅ Certificados (5 endpoints)
- GET `/api/certificates/my-certificates` - Meus certificados
- GET `/api/certificates/:id` - Detalhes do certificado
- GET `/api/certificates/:id/download` - Download PDF
- GET `/api/certificates/verify/:code` - Verificar certificado
- POST `/api/certificates/generate/:courseId` - Gerar certificado

### ✅ Favoritos (4 endpoints)
- GET `/api/favorites` - Listar favoritos
- POST `/api/favorites/:courseId` - Adicionar favorito
- DELETE `/api/favorites/:courseId` - Remover favorito
- GET `/api/favorites/check/:courseId` - Verificar se é favorito

### ✅ Notificações do Usuário (4 endpoints)
- GET `/api/notifications` - Listar notificações
- PUT `/api/notifications/:id/read` - Marcar como lida
- PUT `/api/notifications/read-all` - Marcar todas como lidas
- DELETE `/api/notifications/:id` - Deletar notificação

### ✅ Recomendações (2 endpoints)
- GET `/api/recommendations` - Recomendações personalizadas
- GET `/api/recommendations/trending` - Cursos em alta

### ✅ Reembolsos e Garantia (5 endpoints)
- POST `/api/refunds/request` - Solicitar reembolso
- GET `/api/refunds/my-refunds` - Meus reembolsos
- GET `/api/refunds` - Listar reembolsos (Admin)
- PUT `/api/refunds/:id/approve` - Aprovar reembolso (Admin)
- PUT `/api/refunds/:id/reject` - Rejeitar reembolso (Admin)

### ✅ Busca e Compartilhamento (4 endpoints)
- GET `/api/courses/search` - Busca avançada
- GET `/api/courses/:id/related` - Cursos relacionados
- POST `/api/courses/:id/share` - Gerar link compartilhamento
- GET `/api/courses/shared/:token` - Acessar via link compartilhado

### ✅ Materiais e Downloads (2 endpoints)
- GET `/api/lessons/:lessonId/materials` - Materiais da aula
- GET `/api/materials/:materialId/download` - Download material

### ✅ Histórico e Estatísticas (1 endpoint)
- GET `/api/progress/history` - Histórico de atividades

**🎯 Total: 100+ endpoints completamente especificados e documentados!**

## 📝 Próximos Passos

1. ✅ Stack definida: Node.js + Express + TypeORM + PostgreSQL
2. ✅ Estrutura completa documentada com **100+ endpoints**
3. ✅ Autenticação Google OAuth especificada
4. ✅ Gráficos e analytics detalhados
5. ✅ CRUD completo de módulos e aulas
6. ✅ Sistema de cupons completo
7. ✅ Sistema de certificados
8. ✅ Sistema de favoritos
9. ✅ Notificações para usuários
10. ✅ Sistema de recomendações
11. ✅ Reembolsos e garantia (7 dias)
12. ✅ Busca avançada e compartilhamento
13. ✅ Download de materiais
14. ✅ Histórico de atividades
15. ✅ Perfil e configurações do usuário

### Implementação Técnica

16. Configurar banco de dados PostgreSQL
17. Instalar dependências: `typeorm`, `passport`, `passport-google-oauth20`, `class-validator`, `class-transformer`
18. Criar entidades TypeORM com decorators
19. Configurar Google OAuth no Google Cloud Console
20. Implementar autenticação JWT + Google OAuth
21. Criar migrations TypeORM
22. Implementar controllers e services orientados a objetos
23. Integrar gateway de pagamento (Mercado Pago)
24. Implementar upload de vídeos e imagens
25. Implementar sistema de gráficos e analytics
26. Adicionar testes unitários e de integração
27. Configurar CI/CD
28. Deploy em produção

## ✅ Checklist de Cobertura

Todas as funcionalidades do frontend foram analisadas e estão cobertas:

- ✅ **HomePage**: Busca, filtros, listagem, estatísticas
- ✅ **Detalhes do Curso**: Informações completas, módulos, aulas, avaliações
- ✅ **Carrinho**: CRUD completo, cupons, totais
- ✅ **Checkout**: PIX, Boleto, Cartão, confirmação
- ✅ **Meus Cursos**: Listagem, progresso, estatísticas
- ✅ **Player**: Vídeo, progresso, materiais, download
- ✅ **Admin Panel**: Dashboard completo, gráficos, CRUD, analytics
- ✅ **Login/Registro**: Email/senha + Google OAuth
- ✅ **Certificados**: Geração, download, verificação
- ✅ **Favoritos**: Sistema completo
- ✅ **Notificações**: Para usuários e admin
- ✅ **Reembolsos**: Garantia de 7 dias
- ✅ **Recomendações**: Personalizadas e trending

