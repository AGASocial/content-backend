import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreateMessageDto } from "./dto/createMessage.dto";
import { CreateMessageResponseDto } from "./dto/createMessageResponse.dto";
import { DeleteMessageDto } from "./dto/deleteMessage.dto";
import { DeleteMessageResponseDto } from "./dto/deleteMessageResponse.dto";
import { GetMessagesByKeywordsDto } from "./dto/getMessagesByKeywords.dto";
import { GetMessagesByUserResponseDto } from "./dto/getMessagesByUserResponse.dto";
import {GetMessagesFilteredDto } from "./dto/getMessagesFiltered.dto";
import { MarkAsArchivedDto } from "./dto/markAsArchived.dto";
import { MarkAsArchivedResponseDto } from "./dto/markAsArchivedResponse.dto";
import { MarkAsReadDto } from "./dto/markAsRead.dto";
import { MarkAsReadResponseDto } from "./dto/markAsReadResponse.dto";
import { UpdateMessageStatusDto } from "./dto/updateMessageStatus.dto";
import { UpdateMessageStatusResponseDto } from "./dto/updateMessageStatusResponse.dto";
import { MessageService } from "./message.service";


@Controller()
@ApiTags('Messages')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }



    @ApiOperation({ summary: 'Creates and sends a message to a user' })
    @ApiCreatedResponse({ description: 'Message created successfully.', type: CreateMessageResponseDto })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    @Post('messages')
    async createAndSendMessage(@Body() createNewMessageDto: CreateMessageDto): Promise<CreateMessageResponseDto> {
        try {
            const responseDto = await this.messageService.createAndSendMessage(createNewMessageDto);
            return responseDto;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    /*
    //NOT IN USE
    @ApiOperation({ summary: 'Delete messages from firebase (Not in use)' })
    @ApiNotFoundResponse({ description: 'Message not found.' })
    @ApiBadRequestResponse({ description: 'Bad request.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    @Delete('messages')
    async deleteMessage(@Body() deleteMessageDto: DeleteMessageDto): Promise<DeleteMessageResponseDto> {
        try {
            const responseDto = await this.messageService.deleteMessage(deleteMessageDto);
            return responseDto;
        } catch (error) {
            console.error('Error:', error);
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException('INTERNALERROR');
        }
    }*/



    @ApiOperation({ summary: 'Get messages by user email, keywords or filters' })
    @ApiOkResponse({ description: 'Messages retrieved successfully', type: GetMessagesByUserResponseDto })
    @Get('messages')
    async getMessages(
        @Query('filter') filter: string,
        @Query('email') email: string,
        @Query('keywords') keywords: string[] 
    ): Promise<GetMessagesByUserResponseDto> {
        if (filter && email) {
            return await this.messageService.getFilteredMessages(filter, email);
        } else if (email && keywords && keywords.length > 0) {
            return await this.messageService.searchMessagesByKeywords(email, keywords);
        } else if (email) {
            return this.messageService.getUserMessages(email);
        } else {
            throw new BadRequestException('Invalid parameters');
        }
    }




    @ApiOperation({ summary: 'Update message status to read, unread, inquiry, complaint, archived, unarchived, deactivated, activated' })
    @ApiOkResponse({ description: 'Message status updated successfully', type: UpdateMessageStatusResponseDto })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @Put('messages')
    async updateMessageStatus(
        @Body() dto: UpdateMessageStatusDto,
    ): Promise<UpdateMessageStatusResponseDto> {
        try {
            return await this.messageService.updateMessageStatus(dto);
        } catch (error) {
            console.error('An error occurred:', error);
            throw new Error('There was an error updating the message status.');
        }
    }



   



}