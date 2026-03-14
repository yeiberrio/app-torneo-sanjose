import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { GeoRegion } from '@prisma/client';

@ApiTags('Geography')
@Controller('geo')
export class GeoController {
  constructor(private geoService: GeoService) {}

  @Get('municipalities')
  @ApiOperation({ summary: 'Listar municipios' })
  getMunicipalities(@Query('region') region?: GeoRegion) {
    return this.geoService.getMunicipalities(region);
  }

  @Get('municipalities/:id/sectors')
  @ApiOperation({ summary: 'Listar barrios/veredas de un municipio' })
  getSectors(@Param('id') id: string) {
    return this.geoService.getSectors(id);
  }
}
