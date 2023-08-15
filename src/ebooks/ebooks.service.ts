import * as admin from 'firebase-admin';
import { Ebook, EbookFormat } from './entities/ebooks.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateEbookDto } from './dto/createEbook.dto';
import { CreateEbookResponseDto } from './dto/createEbookResponse.dto';
import { addDoc, collection, deleteDoc, getDocs, orderBy, query, QueryFieldFilterConstraint, updateDoc, where } from 'firebase/firestore';
import { UpdateMediaDto } from '../media/dto/updateMedia.dto';
import { UpdateMediaResponseDto } from '../media/dto/updateMediaResponse.dto';
import { DeleteEbookResponseDto } from './dto/deleteEbookResponse.dto';
import { GetEbooksResponseDto } from './dto/getEbooksResponse.dto';



@Injectable()
export class EbookService {

    constructor(private firebaseService: FirebaseService) { }

    async createNewEbook(createNewEbookDto: CreateEbookDto): Promise<CreateEbookResponseDto> {
    

        const { title, description, url, titlePage, author, releaseDate, price, language, pageCount, genres, format, publisher } = createNewEbookDto;
        const ebookRef = collection(this.firebaseService.fireStore, 'ebooks');

        const customEbookWhere: QueryFieldFilterConstraint = where('url', '==', url);
        const ebookQuery = query(ebookRef, customEbookWhere);
        const ebookQuerySnapshot = await getDocs(ebookQuery);

        if (!ebookQuerySnapshot.empty) {
            throw new BadRequestException('URL ALREADY EXISTS');
        }

        const newEbook: Ebook = {
            title: title,
            publisher: publisher,
            description: description,
            url: url,
            titlePage: titlePage,
            author: author,
            releaseDate: releaseDate,
            price: price,
            language: language,
            pageCount: pageCount,
            genres: genres,
            format: format,
            salesCount: 0,
            isActive: true,

        };

        const newEbookDocRef = await addDoc(ebookRef, newEbook);
        const newEbookId = newEbookDocRef.id;


        const cachedCourses = await this.firebaseService.getCollectionData('ebooks');
        cachedCourses.push({
            title,
            publisher,
            description,
            url,
            author,
            releaseDate,
            price,
            language,
            pageCount,
            genres,
            format,
            salesCount: 0,
            isActive: true,
            titlePage,

        });
        this.firebaseService.setCollectionData('ebooks', cachedCourses);
        console.log('Ebook added to the cache successfully.');



        const responseDto = new CreateEbookResponseDto(201, 'EBOOKCREATEDSUCCESSFULLY');
        return responseDto;
    }


    async updateEbook(url: string, newData: Partial<UpdateMediaDto>): Promise<UpdateMediaResponseDto> {
        try {
            console.log('Initializing updateEbook...');
            const ebooksCollectionRef = admin.firestore().collection('ebooks');

            const querySnapshot = await ebooksCollectionRef.where('url', '==', url).get();

            if (querySnapshot.empty) {
                console.log(`The ebook with the url "${url}" does not exist.`);
                throw new Error('EBOOKDOESNOTEXIST.');
            }

            const batch = admin.firestore().batch();
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, newData);
            });

            await batch.commit();
            console.log(`Updated info for ebook with url "${url}"`);

            const cachedCourses = await this.firebaseService.getCollectionData('ebooks');
            const updatedCourseIndex = cachedCourses.findIndex((ebook) => ebook.url === url);
            if (updatedCourseIndex !== -1) {
                cachedCourses[updatedCourseIndex] = { ...cachedCourses[updatedCourseIndex], ...newData };
                this.firebaseService.setCollectionData('ebooks', cachedCourses);
            }


            const response: UpdateMediaResponseDto = {
                statusCode: 200,
                message: 'EBOOKUPDATEDSUCCESSFULLY',
            };

            return response;
        } catch (error) {
            console.error('There was an error updating the ebook data:', error);
            throw error;
        }
    }

    //NOT IN USE
    async deleteEbook(title: string, format: EbookFormat): Promise<DeleteEbookResponseDto> {
        try {

            const ebooksCollectionRef = collection(this.firebaseService.fireStore, 'ebooks');
            const ebooksQuerySnapshot = await getDocs(query(ebooksCollectionRef, where('title', '==', title)));

            if (ebooksQuerySnapshot.empty) {
                console.log(`Ebook with title "${title}" not found in the ebooks collection.`);
                throw new NotFoundException('EBOOKNOTFOUND');
            }
            const ebooksDoc = ebooksQuerySnapshot.docs[0];

            const ebookData = ebooksDoc.data() as Ebook;



                if (ebookData.format == format) {
                    await deleteDoc(ebooksDoc.ref);
                } else {
                    console.log(`Ebook with format "${format}" and title "${title}" not found in the ebooks collection.`);
                    throw new NotFoundException('EBOOKNOTFOUND');


            }


            const cachedCourses = await this.firebaseService.getCollectionData('ebooks');
            const indexToDelete = cachedCourses.findIndex((ebook) => ebook.title === title);

            if (indexToDelete !== -1) {
                cachedCourses.splice(indexToDelete, 1);
                this.firebaseService.setCollectionData('ebooks', cachedCourses);
            }


            const response: DeleteEbookResponseDto = {
                statusCode: 200,
                message: 'EBOOKDELETEDSUCCESSFULLY',
            };

            console.log(`The ebook has been deleted successfully.`);
            return response;
        } catch (error: unknown) {
            console.warn(`[ERROR]: ${error}`);
            throw new InternalServerErrorException('INTERNALERROR');
        }
    }



    async deactivateEbook(title: string, format: EbookFormat): Promise<DeleteEbookResponseDto> {
        try {
            const ebooksCollectionRef = collection(this.firebaseService.fireStore, 'ebooks');
            const ebooksQuerySnapshot = await getDocs(query(ebooksCollectionRef, where('title', '==', title)));

            if (ebooksQuerySnapshot.empty) {
                console.log(`Ebook with title "${title}" not found in the ebooks collection.`);
                throw new NotFoundException('EBOOKNOTFOUND');
            }

            const ebooksDoc = ebooksQuerySnapshot.docs[0];

            const ebookData = ebooksDoc.data() as Ebook;

            if (ebookData.format == format) {
                // Update "isActive" attribute in Firestore
                await updateDoc(ebooksDoc.ref, {
                    isActive: false,
                });
            } else {
                console.log(`Ebook with format "${format}" and title "${title}" not found in the ebooks collection.`);
                throw new NotFoundException('EBOOKNOTFOUND');
            }

            const cachedEbooks = await this.firebaseService.getCollectionData('ebooks');
            const indexToUpdate = cachedEbooks.findIndex((ebook) => ebook.title === title);

            if (indexToUpdate !== -1) {
                cachedEbooks[indexToUpdate].isActive = false; // Update isActive attribute
                this.firebaseService.setCollectionData('ebooks', cachedEbooks);
            }

            const response: DeleteEbookResponseDto = {
                statusCode: 200,
                message: 'EBOOKDEACTIVATEDSUCCESSFULLY',
            };

            console.log(`The ebook has been deactivated successfully.`);
            return response;
        } catch (error: unknown) {
            console.warn(`[ERROR]: ${error}`);
            throw new InternalServerErrorException('INTERNALERROR');
        }
    }




    async getEbooks(): Promise<GetEbooksResponseDto> {
        try {
            console.log('Initializing getEbooks...');

            // Tries to use data in cache if it exists
            const cachedEbooks = await this.firebaseService.getCollectionData('ebooks');
            if (cachedEbooks.length > 0) {
                console.log('Using cached ebooks data.');
                const activeEbooks = cachedEbooks.filter(ebook => ebook.isActive); 
                const getEbooksDtoResponse: GetEbooksResponseDto = {
                    statusCode: 200,
                    message: "EBOOKSGOT",
                    ebooksFound: activeEbooks,
                };
                return getEbooksDtoResponse;
            }

            // If there is no data, it uses firestore instead
            const ebooksRef = this.firebaseService.ebooksCollection;
            const ebooksQuery = query(ebooksRef, where("isActive", "==", true), orderBy("title")); 
            console.log('Ebooks query created.');

            const ebooksQuerySnapshot = await getDocs(ebooksQuery);
            console.log('Ebooks query snapshot obtained.');

            const queryResult = [];
            ebooksQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                queryResult.push({
                    title: data.title,
                    publisher: data.publisher,
                    author: data.author,
                    description: data.description,
                    titlePage: data.titlePage,
                    url: data.url,
                    releaseDate: data.releaseDate,
                    price: data.price,
                    language: data.language,
                    pageCount: data.pageCount,
                    genres: data.genres,
                    format: data.format,
                    salesCount: data.salesCount,
                });
            });
            console.log('Ebook data collected.');

            // the data is saved in cache for future queries
            this.firebaseService.setCollectionData('ebooks', queryResult);

            const getEbooksDtoResponse: GetEbooksResponseDto = {
                statusCode: 200,
                message: "EBOOKSGOT",
                ebooksFound: queryResult,
            };
            console.log('Response created.');

            return getEbooksDtoResponse;
        } catch (error) {
            console.error('An error occurred:', error);
            throw new Error('There was an error retrieving the ebooks.');
        }
    }




    async getEbooksByKeywords(keywords: string[]): Promise<GetEbooksResponseDto> {
        try {
            console.log('Initializing getEbooksByKeywords...');

            // Tries to use data in cache if it exists
            const cachedEbooks = await this.firebaseService.getCollectionData('ebooks');
            if (cachedEbooks.length > 0) {
                console.log('Using cached ebooks data.');
                const matchedEbooks = cachedEbooks.filter(ebook =>
                    ebook.isActive && keywords.some(keyword => ebook.title.toLowerCase().includes(keyword.toLowerCase()))
                );

                const responseDto: GetEbooksResponseDto = {
                    statusCode: 200,
                    message: 'EBOOKSGOT',
                    ebooksFound: matchedEbooks,
                };
                return responseDto;
            }

            // If there is no data in cache, query Firestore
            const ebooksRef = this.firebaseService.ebooksCollection;
            const ebooksQuery = query(ebooksRef, orderBy('title'));
            console.log('Ebooks query created.');

            const ebooksQuerySnapshot = await getDocs(ebooksQuery);
            console.log('Ebooks query snapshot obtained.');

            const queryResult = [];
            ebooksQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                queryResult.push({
                    title: data.title,
                    publisher: data.publisher,
                    author: data.author,
                    description: data.description,
                    titlePage: data.titlePage,
                    url: data.url,
                    releaseDate: data.releaseDate,
                    price: data.price,
                    language: data.language,
                    pageCount: data.pageCount,
                    genres: data.genres,
                    format: data.format,
                    salesCount: data.salesCount,
                    isActive: data.isActive, 
                });
            });
            console.log('Ebook data collected.');

            // Filter the eBooks by keywords and isActive
            const matchedEbooks = queryResult.filter(ebook =>
                ebook.isActive && keywords.some(keyword => ebook.title.toLowerCase().includes(keyword.toLowerCase()))
            );

            // Save the data in cache for future queries
            await this.firebaseService.setCollectionData('ebooks', queryResult);

            const responseDto: GetEbooksResponseDto = {
                statusCode: 200,
                message: 'EBOOKSGOT',
                ebooksFound: matchedEbooks,
            };
            console.log('Response created.');

            return responseDto;
        } catch (error) {
            console.error('An error occurred:', error);
            throw new Error('There was an error retrieving the ebooks.');
        }
    }


  






}