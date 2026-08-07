import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @Post('create-intent')
  @ApiOperation({ summary: 'Create payment intent' })
  createIntent(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.paymentService.createIntent(userId, data);
  }

  @ApiBearerAuth()
  @Post('process')
  @ApiOperation({ summary: 'Process payment' })
  process(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.paymentService.process(userId, data);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  getById(@Param('id') id: string) {
    return this.paymentService.getById(id);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Payment provider webhook endpoint' })
  handleWebhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }
}
