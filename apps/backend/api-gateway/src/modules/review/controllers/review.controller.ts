import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewService } from '../services/review.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Submit product review' })
  create(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.reviewService.create(userId, data);
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'List reviews for product' })
  listByProduct(@Param('productId') productId: string) {
    return this.reviewService.listByProduct(productId);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete review' })
  delete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.reviewService.delete(id, userId);
  }
}
