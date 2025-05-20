import { error } from 'console';
export class LatLongToAddress {
  constructor() {}
  async findLocation({
    latitude,
    longitude,
  }: {
    latitude: string;
    longitude: string;
  }): Promise<any> {
    try{
        if (!latitude) {
            return 'Latitude is Required!';
          }
          if (!longitude) {
            return 'Longitude is Required!';
          }
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=54411e052e544c04b65442b11b490ae6&language=en`,
          );
          if(!response){
            return 'You provided wrong latitude and longitude!'
          }
          return response
    }catch(error){
        return error
    }
   
  }
}
