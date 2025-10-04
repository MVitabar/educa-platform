/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Token de autenticación JWT
 *   
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           default: false
 *         message:
 *           type: string
 *           description: Mensaje de error descriptivo
 *         error:
 *           type: object
 *           description: Detalles adicionales del error (opcional)
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Número total de resultados
 *         pages:
 *           type: integer
 *           description: Número total de páginas
 *         page:
 *           type: integer
 *           description: Página actual
 *         limit:
 *           type: integer
 *           description: Límite de resultados por página
 *         next:
 *           type: object
 *           nullable: true
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *         prev:
 *           type: object
 *           nullable: true
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *
 *     UserReference:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *         name:
 *           type: string
 *           example: 'Juan Pérez'
 *         avatar:
 *           type: string
 *           format: uri
 *           example: 'https://example.com/avatar.jpg'
 *
 *     CourseBase:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - instructor
 *         - price
 *         - duration
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           example: 'Desarrollo Web con React y Node.js'
 *           description: Título del curso
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           example: 'Aprende a crear aplicaciones web completas con React y Node.js'
 *           description: Descripción detallada del curso
 *         instructor:
 *           oneOf:
 *             - $ref: '#/components/schemas/UserReference'
 *             - type: string
 *               format: ObjectId
 *           description: Referencia al usuario instructor
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 49.99
 *           description: Precio del curso en USD
 *         duration:
 *           type: number
 *           minimum: 1
 *           example: 10
 *           description: Duración del curso en horas
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           default: 'beginner'
 *           example: 'beginner'
 *           description: Nivel de dificultad del curso
 *         category:
 *           type: string
 *           example: 'Desarrollo Web'
 *           description: Categoría del curso
 *         image:
 *           type: string
 *           format: uri
 *           example: 'https://example.com/course-image.jpg'
 *           description: URL de la imagen del curso
 *         isPublished:
 *           type: boolean
 *           default: false
 *           description: Indica si el curso está publicado
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *             example: 'Conocimientos básicos de programación'
 *           description: Requisitos previos para el curso
 *         whatYouWillLearn:
 *           type: array
 *           items:
 *             type: string
 *             example: 'Crear aplicaciones web completas'
 *           description: Lo que aprenderás en el curso
 *         whoIsThisCourseFor:
 *           type: array
 *           items:
 *             type: string
 *             example: 'Desarrolladores principiantes'
 *           description: A quién va dirigido este curso
 *
 *     Course:
 *       allOf:
 *         - $ref: '#/components/schemas/CourseBase'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               format: ObjectId
 *               example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *               description: ID único del curso
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: '2023-01-01T00:00:00.000Z'
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: '2023-01-01T00:00:00.000Z'
 *             rating:
 *               type: object
 *               properties:
 *                 average:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 5
 *                   example: 4.5
 *                 count:
 *                   type: integer
 *                   minimum: 0
 *                   example: 10
 *               description: Calificación promedio y número de valoraciones
 *             studentsEnrolled:
 *               type: integer
 *               minimum: 0
 *               example: 100
 *               description: Número de estudiantes inscritos
 *
 *     CreateCourseInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - duration
 *         - category
 *       properties:
 *         title:
 *           $ref: '#/components/schemas/CourseBase/properties/title'
 *         description:
 *           $ref: '#/components/schemas/CourseBase/properties/description'
 *         price:
 *           $ref: '#/components/schemas/CourseBase/properties/price'
 *         duration:
 *           $ref: '#/components/schemas/CourseBase/properties/duration'
 *         level:
 *           $ref: '#/components/schemas/CourseBase/properties/level'
 *         category:
 *           $ref: '#/components/schemas/CourseBase/properties/category'
 *         image:
 *           $ref: '#/components/schemas/CourseBase/properties/image'
 *         isPublished:
 *           $ref: '#/components/schemas/CourseBase/properties/isPublished'
 *         requirements:
 *           $ref: '#/components/schemas/CourseBase/properties/requirements'
 *         whatYouWillLearn:
 *           $ref: '#/components/schemas/CourseBase/properties/whatYouWillLearn'
 *         whoIsThisCourseFor:
 *           $ref: '#/components/schemas/CourseBase/properties/whoIsThisCourseFor'
 *
 *     UpdateCourseInput:
 *       type: object
 *       properties:
 *         title:
 *           $ref: '#/components/schemas/CourseBase/properties/title'
 *         description:
 *           $ref: '#/components/schemas/CourseBase/properties/description'
 *         price:
 *           $ref: '#/components/schemas/CourseBase/properties/price'
 *         duration:
 *           $ref: '#/components/schemas/CourseBase/properties/duration'
 *         level:
 *           $ref: '#/components/schemas/CourseBase/properties/level'
 *         category:
 *           $ref: '#/components/schemas/CourseBase/properties/category'
 *         image:
 *           $ref: '#/components/schemas/CourseBase/properties/image'
 *         isPublished:
 *           $ref: '#/components/schemas/CourseBase/properties/isPublished'
 *         requirements:
 *           $ref: '#/components/schemas/CourseBase/properties/requirements'
 *         whatYouWillLearn:
 *           $ref: '#/components/schemas/CourseBase/properties/whatYouWillLearn'
 *         whoIsThisCourseFor:
 *           $ref: '#/components/schemas/CourseBase/properties/whoIsThisCourseFor'
 */

// This file contains shared OpenAPI components that can be referenced by other files
// using $ref: '#/components/schemas/ComponentName'
