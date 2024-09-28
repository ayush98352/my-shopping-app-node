import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '../config/config.service';
import { Connection } from 'mysql2';
import { EntityManager } from 'typeorm';
import { InjectDataSource, getEntityManagerToken } from '@nestjs/typeorm';

@Injectable()
export class MysqlConnService {
  constructor(private moduleRef: ModuleRef) {}
  private async loadEntityManager(serverIp: string): Promise<EntityManager> {
    return this.moduleRef.get(getEntityManagerToken(`server-${serverIp}`), {
      strict: false,
    });
  }
  async dbCall(queryParams) {
    const entityManager = await this.loadEntityManager(queryParams['server']);
    if (!entityManager) {
      return [];
    }
    return entityManager.query(queryParams['query']);
  }

  async dbCallPdo(queryParams) {
    //document link for createQueryBuilder https://orkhan.gitbook.io/typeorm/docs/select-query-builder#what-is-querybuilder
    const entityManager = await this.loadEntityManager(queryParams['server']);

    if (!entityManager) {
      return [];
    }

    let queryBuilder = queryParams.queryDetail;
    let query = <any>{};
    switch (queryBuilder.queryType) {
      case 'select':
        query = entityManager.createQueryBuilder();
        if ('select' in queryBuilder) {
          // Incase of 'select *' we can ignore select in querBuilder
          query = query.select(queryBuilder.select);
        }
        
        query = query.from(queryBuilder.dbTable, null);

        if (queryBuilder.where) {
          query = query.where(queryBuilder.where, queryBuilder.whereParams);
        }

        if ('limit' in queryBuilder && Number(queryBuilder.limit) >= 1) {
          query.limit(queryBuilder.limit);
        }

        if ('offset' in queryBuilder) {
          query.offset(queryBuilder.offset);
        }

        if ('groupBy' in queryBuilder) {
          query.groupBy(queryBuilder.groupBy);
        }


        // use addGroupBy after group by if need group by on more than one column
        if ('addGroupBy' in queryBuilder && queryBuilder.addGroupBy.length > 0) {

          for (let index = 0; index < queryBuilder.addGroupBy; index++) {
            query.addGroupBy(queryBuilder.addGroupBy[index]);
          }
        }


        // use addOrderBy after group by if need group by on more than one column
        
        if ('orderBy' in queryBuilder) {
          query.orderBy(queryBuilder.orderBy,queryBuilder.sortOrder);
        }


        if ('addOrderBy' in queryBuilder && queryBuilder.addOrderBy.length > 0) {
          // console.log(queryBuilder.addOrderBy);
          for (let index = 0; index < queryBuilder.addOrderBy.length; index++) {
            query.addOrderBy(queryBuilder.addOrderBy[index]);
          }
        }
        // use addOrderBy after group by if need group by on more than one column

        break;
      case 'insert':
        query = entityManager
          .createQueryBuilder()
          .insert()
          .into(queryBuilder.dbTable)
          .values(queryBuilder.insertParams);

        break;
      case 'update':
        query = entityManager
          .createQueryBuilder()
          .update(queryBuilder.dbTable)
          .set(queryBuilder.updateParams)
          .where(queryBuilder.where, queryBuilder.whereParams);

        break;
      case 'delete':
        query = entityManager
          .createQueryBuilder()
          .delete()
          .from(queryBuilder.dbTable, null)
          .where(queryBuilder.where, queryBuilder.whereParams);

        break;
      default:
        console.log('queryType is required');
        break;
    }

    if (queryParams.debug == 1) {
      return await query.getSql();
    }


    if(queryBuilder.debug ==1){
      let debugRes = <any>{};
      debugRes['pdo_query'] = await query.getQuery();
      debugRes['whereParams'] = queryBuilder.whereParams;
      debugRes['query'] = await query.getSql();
      console.log(debugRes);
      // return debugRes;
    }   


    const res = await query.execute();
      return res;
      
  }

  async dbCallPdoWIBuilder(queryParams) {
    const entityManager = await this.loadEntityManager(queryParams['server']);
    if (!entityManager) {
      return [];
    }
    return entityManager.query(queryParams['query'], queryParams['params']);
  }
}


