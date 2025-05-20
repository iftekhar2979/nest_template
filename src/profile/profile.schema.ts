import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { CaloryType, GenderType, HeightType, WeightType } from 'src/users/dto/createUser.dto';

// Define the User schema using the Schema decorator
@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true })
  dOB: Date;
  @Prop({required:true , type:String})
  height:string
  @Prop({required:true,type:String})
  weight:string
  @Prop({required:true,type:String,enum:WeightType,default:WeightType.KG})
  weightType:WeightType
  @Prop({required:true,type:String,enum:CaloryType,default:CaloryType.CAL})
  calorieType:CaloryType
  @Prop({required:true,type:String,enum:HeightType,default:HeightType.CM})
  heightType:HeightType
  @Prop({type:String,required:true})
  goal:string
  @Prop({type:String,required:true})
  weightGoal:string
  @Prop({type:Number,required:true})
  caloryGoal:number
  @Prop({type:Number,required:true})
  protienGoal:number
  @Prop({type:Number,required:true})
  carbsGoal:number
  @Prop({type:Number,required:true})
  fatGoal:number
  @Prop({enum:GenderType,required:true})
  gender: GenderType;
 
}
// Create the schema and apply pre-save hook outside the class
export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({
  fullName: 'text',
  email: 'text'  
});
