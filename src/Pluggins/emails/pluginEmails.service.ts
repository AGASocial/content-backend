import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBadRequestResponse, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { addDoc, collection, CollectionReference, doc, DocumentReference, getDocs, query, where } from "firebase/firestore";
import { FirebaseService } from "../../firebase/firebase.service";
import { CreateEmailResponseDto } from "./dto/createEmailResponse.dto";
import { CreatePluginResponseDto } from "./dto/createPluginResponse.dto";
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from "./dto/createUser.dto";
import { CreateUserResponseDto } from "./dto/createUserResponse.dto";
import { UsersService } from "../../users/users.service";
import { HashService } from "../../utils/hash.service";
import { GetEmailsResponseDto } from "./dto/getEmailsResponse.dto";
import { GetUsersByPluginIdResponseDto } from "./dto/getUsersResponse.dto";




@Injectable()
export class EmailsService {
    constructor(private firebaseService: FirebaseService, private hashService: HashService) { }


    @ApiOperation({ summary: 'Register an email in Firestore subcollection' })
    @ApiBadRequestResponse({ description: 'Invalid parameter/s' })
    async registerEmail(email: string, pluginId: string): Promise<CreateEmailResponseDto> {
        try {
            const pluginDocumentRef: DocumentReference = doc(this.firebaseService.fireStore, 'newPlugins', pluginId);
            const emailsCollectionRef = collection(pluginDocumentRef, 'emails');
            await addDoc(emailsCollectionRef, { email });
            return new CreateEmailResponseDto(201, 'EMAILREGISTEREDSUCCESSFULLY');
        } catch (error) {
            console.error('Error registering the email:', error);
            throw new Error(`Error registering the email: ${error.message}`);
        }
    }



    @ApiOperation({ summary: 'Register a new plugin in Firestore' })
    @ApiResponse({
        status: 201,
        description: 'The plugin was created successfully',
        type: CreatePluginResponseDto,
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async registerNewPlugin(domain: string): Promise<CreatePluginResponseDto> {
        try {
            const newPluginsCollectionRef: CollectionReference = collection(this.firebaseService.fireStore, 'newPlugins');

            const ownerId: string = uuidv4();

            const pluginData = {
                domain,
                ownerId,
            };

            const newPluginDocumentRef: DocumentReference = await addDoc(newPluginsCollectionRef, pluginData);

            const newPluginId = newPluginDocumentRef.id;

            return new CreatePluginResponseDto(201, 'PLUGINCREATEDSUCCESSFULLY', newPluginId, ownerId);
        } catch (error) {
            console.error('Error registering the new plugin:', error);
            throw new Error(`Error registering the new plugin: ${error.message}`);
        }
    }




    async registerUser(createUserDto: CreateUserDto, pluginId: string): Promise<CreateUserResponseDto> {
        try {
            const { email, username, password, name } = createUserDto;

            const emailQuery = query(
                collection(this.firebaseService.fireStore, 'newPlugins', pluginId, 'pluginUsers'),
                where('email', '==', email)
            );
            const emailQuerySnapshot = await getDocs(emailQuery);

            const usernameQuery = query(
                collection(this.firebaseService.fireStore, 'newPlugins', pluginId, 'pluginUsers'),
                where('username', '==', username)
            );
            const usernameQuerySnapshot = await getDocs(usernameQuery);

            if (!emailQuerySnapshot.empty) {
                throw new BadRequestException('Email already exists');
            }

            if (!usernameQuerySnapshot.empty) {
                throw new BadRequestException('Username already exists');
            }

            const hashedPassword = await this.hashService.hashString(password);
            createUserDto.password = hashedPassword;

            const userId = uuidv4();

            const pluginDocumentRef: DocumentReference = doc(this.firebaseService.fireStore, 'newPlugins', pluginId);
            const usersCollectionRef = collection(pluginDocumentRef, 'pluginUsers');

            await addDoc(usersCollectionRef, { email, username, hashedPassword, name, userId });

            return new CreateUserResponseDto(201, 'USERREGISTEREDSUCCESSFULLY', userId);
        } catch (error) {
            console.error('Error registering the user:', error);
            throw new BadRequestException(`Error registering the user: ${error.message}`);
        }
    }



    async getEmailsByPluginId(pluginId: string): Promise<GetEmailsResponseDto> {
        try {
            const pluginDocumentRef = doc(this.firebaseService.fireStore, 'newPlugins', pluginId);
            const emailsCollectionRef = collection(pluginDocumentRef, 'emails');
            const querySnapshot = await getDocs(emailsCollectionRef);

            const emails: string[] = [];

            querySnapshot.forEach((doc) => {
                const emailData = doc.data();
                const email = emailData.email;

                if (email) {
                    emails.push(email);
                }
            });

            const responseDto = new GetEmailsResponseDto(200, 'EMAILSRETRIEVEDSUCCESSFULLY', emails);

            return responseDto;
        } catch (error) {
            console.error('Error fetching emails:', error);
            throw new Error(`Error fetching emails: ${error.message}`);
        }
    }




    async getUsersByPluginId(pluginId: string): Promise<GetUsersByPluginIdResponseDto> {
        try {
            const pluginDocumentRef = doc(this.firebaseService.fireStore, 'newPlugins', pluginId);
            const usersCollectionRef = collection(pluginDocumentRef, 'pluginUsers');
            const querySnapshot = await getDocs(usersCollectionRef);

            const users: Record<string, any>[] = [];

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const { hashedPassword, ...userWithoutPassword } = userData;
                users.push(userWithoutPassword);
            });

            const responseDto = new GetUsersByPluginIdResponseDto(
                200,
                'USERSRETRIEVEDSUCCESSFULLY',
                users,
            );

            return responseDto;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new BadRequestException(`Error fetching users: ${error.message}`);
        }
    }







}