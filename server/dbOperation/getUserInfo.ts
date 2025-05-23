import { MongoDBConnector } from '~/server/utils/mongodbConn';
import { IUser, userSchema } from '~/server/db_data_schema/UserSchema';
import { getCorrectUser } from '~/server/DataFixer/UserInformationFixer';
import { cleanMongoObject } from '~/server/utils/cleanObject';
import { getThreshold } from '~/server/utils/getShareSettings';

export async function getUserInfo(dbConnector:MongoDBConnector,CUUID: string): Promise<IUser | null> {
  const connections = dbConnector.getDbConnections();
  try {
    const userArr: (IUser | undefined)[] = [];
    const problemInt: number[] = [];

    await Promise.all(
      connections.map(async (conn, index) => {
        try {
          const userModel = conn.model<IUser>("user", userSchema);
          const userInfo = await userModel.findOne({ CUUID }).lean();
          //do verify here !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          if (userInfo) {
            userArr.push(cleanMongoObject(userInfo) as IUser);
            //console.log(userInfo);
          } else {
            userArr.push(undefined);
            problemInt.push(index);
          }
        } catch (error) {
          console.error(`Error fetching user data from DB ${conn.name}:`, error);
          userArr.push(undefined);
          problemInt.push(index);
        }
      })
    );

    if (userArr.filter(u => u !== undefined).length < getThreshold()) {
      throw new Error('Insufficient user data');
    }

    const user = await getCorrectUser(userArr, problemInt);
    return user;
  }catch(e){
    throw e
  }
}
