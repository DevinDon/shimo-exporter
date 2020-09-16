import { Logger } from '@iinfinity/logger';
import Axios, { AxiosInstance } from 'axios';
import * as download from 'download';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ShimoFile } from './@types';

export class ShimoExporter {

  static readonly url = {
    api: 'https://shimo.im/api/',
    files: 'https://shimo.im/lizard-api/files/',
    export: 'https://xxport.shimo.im/files/'
  };

  private logger: Logger;
  private axios: AxiosInstance = Axios.create({ timeout: 30 * 1000 });
  private retries: { [index: string]: number } = {};

  constructor(
    private config: {
      cookie: string,
      path: string
    }
  ) {
    existsSync('log') || mkdirSync('log');
    this.logger = new Logger({
      name: 'shimo',
      stdout: process.stdout,
      stderr: process.stderr,
      fileout: join('log', `shimo.${Date.now()}.log`),
      fileerr: join('log', `shimo.${Date.now()}.error.log`),
    });
    this.axios.interceptors.request.use(
      request => {
        request.headers.cookie = config.cookie;
        request.headers.referer = 'https://shimo.im/folder/123123';
        return request;
      }
    );
    this.axios.interceptors.response.use(response => response.data);
  }

  async getFolderInfo(folder: string): Promise<ShimoFile> {
    return this.axios
      .get(
        `${ShimoExporter.url.files}${folder}`,
        { params: { collaboratorCount: true } }
      );
    // https://shimo.im/lizard-api/files/5xkGMmrmmefKYV3X?collaboratorCount=true
  }

  async getFileList(folder: string): Promise<ShimoFile[]> {
    return this.axios.get(
      ShimoExporter.url.files,
      { params: { collaboratorCount: true, folder } }
    );
  }

  async getContentURL(guid: string): Promise<string> {
    return this.axios
      .get<any, any>(
        ShimoExporter.url.files + guid,
        { params: { contentUrl: true } }
      )
      .then(data => data.contentUrl);
  }

  async getExportURL({ guid, name, type }: Pick<ShimoFile, 'guid' | 'name'> & { type: string }): Promise<string> {

    return this.axios
      .get(
        `${ShimoExporter.url.export}${guid}/export`,
        {
          params: {
            type,
            file: guid,
            returnJson: 1,
            name: encodeURIComponent(name)
          }
        }
      )
      .then((data: any) => data.redirectUrl);
  }

  async download(
    { url, dist }: { url: string, dist: string }
  ) {
    return download(
      url,
      dist,
      {
        timeout: 30 * 1000, // 30s timeout
        headers: {
          cookie: this.config.cookie,
          referer: 'https://shimo.im/folder/123123'
        }
      }
    );
  }

  async exportBoard(file: ShimoFile, dist: string) {
    this.logger.warn(`石墨白板无法导出：【${join(dist, file.name)}】`);
  }

  async exportForm(file: ShimoFile, dist: string) {
    this.logger.warn(`石墨表单无法导出：【${join(dist, file.name)}】`);
  }

  async exportMindMap(file: ShimoFile, dist: string) {
    this.logger.info(`思维导图导出中：【${join(dist, file.name)}】`);
    const cdn = await this.getContentURL(file.guid);
    return this.download({
      url: `${ShimoExporter.url.api}${file.type}/exports?url=${encodeURIComponent(cdn)}&format=xmind&name=${encodeURIComponent(file.name)}`,
      dist
    });
    // https://shimo.im/lizard-api/files/R13j8r1gOjUMQJk5?contentUrl=true
    // https://shimo.im/api/mindmap/exports?url=https%3A%2F%2Ffile-contents-23456789.oss-cn-beijing.aliyuncs.com%2FR13j8r1gOjUMQJk5%3FOSSAccessKeyId%3DLTAI4FoEPTasjWkqu1meFaHK%26Expires%3D1600149182%26Signature%3DXqSWO4bsREwnI0dz3OnvCxQrbaY%253D&format=xmind&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportSlide(file: ShimoFile, dist: string) {
    this.logger.info(`幻灯片导出中：【${join(dist, file.name)}】`);
    return this.download({
      url: await this.getExportURL({ guid: file.guid, name: file.name, type: 'pptx' }),
      dist
    });
    // https://xxport.shimo.im/files/wV3VVN74rZs8VJ3y/export?type=pptx&file=wV3VVN74rZs8VJ3y&returnJson=1&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportSheet(file: ShimoFile, dist: string) {
    this.logger.info(`表格导出中：【${join(dist, file.name)}】`);
    return this.download({
      url: await this.getExportURL({ guid: file.guid, name: file.name, type: 'xlsx' }),
      dist
    });
    // https://xxport.shimo.im/files/1d3aVWr6BeU8pQqg/export?type=xlsx&file=1d3aVWr6BeU8pQqg&returnJson=1&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportDoc(file: ShimoFile, dist: string) {
    this.logger.info(`Office 文档导出中：【${join(dist, file.name)}】`);
    return this.download({
      url: await this.getExportURL({ guid: file.guid, name: file.name, type: 'docx' }),
      dist
    });
    // https://xxport.shimo.im/files/loqeWmz7wYFxOyAn/export?type=docx&file=loqeWmz7wYFxOyAn&returnJson=1&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportNewDoc(file: ShimoFile, dist: string) {
    this.logger.info(`MarkDown 文档导出中：【${join(dist, file.name)}】`);
    return this.download({
      url: await this.getExportURL({ guid: file.guid, name: file.name, type: 'md' }),
      dist
    });
  }

  async exportDownload(file: ShimoFile, dist: string) {
    this.logger.info(`原始类型文档下载中：【${join(dist, file.name)}】`);
    return this.download({
      url: file.downloadUrl,
      dist
    });
  }

  async exportUnknown(file: ShimoFile, dist: string) {
    this.logger.info(`未知类型文档下载中：【${join(dist, file.name)}】`);
    return this.download({
      url: file.downloadUrl,
      dist
    });
    // .replace(/[\'\"\\\/\b\f\n\r\t]/g, '_')
  }

  async downloadFolder(folder: string, dist: string = this.config.path) {

    const list: ShimoFile[] = await this.getFileList(folder);
    dist = join(dist, await this.getFolderInfo(folder).then(folder => folder.name));

    for (const file of list) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (file.isFolder) {
        this.downloadFolder(file.guid, dist);
      } else {
        this.downloadFile(file, dist);
      }
    }

  }

  async downloadFile(file: ShimoFile, dist: string) {

    try {
      switch (file.type) {
        case 'board':
          await this.exportBoard(file, dist);
          break;
        case 'form':
          await this.exportForm(file, dist);
          break;
        case 'mindmap':
          await this.exportMindMap(file, dist);
          break;
        case 'slide':
          await this.exportSlide(file, dist);
          break;
        case 'mosheet':
          await this.exportSheet(file, dist);
          break;
        case 'modoc':
          await this.exportDoc(file, dist);
          break;
        case 'newdoc':
          await this.exportNewDoc(file, dist);
          break;
        case 'xls':
        case 'pdf':
        case 'img':
          await this.exportDownload(file, dist);
          break;
        default:
          await this.exportUnknown(file, dist);
          break;
      }
    } catch (error) {
      if (this.retries[file.guid] === undefined) {
        this.retries[file.guid] = 0;
      }
      if (this.retries[file.guid] >= 3) {
        this.logger.error(`文档导出失败：【${join(dist, file.name)}】`);
      } else {
        this.retries[file.guid] += 1;
        this.logger.warn(`文档导出失败，重试第 ${this.retries[file.guid]} 次：【${join(dist, file.name)}】`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.downloadFile(file, dist);
      }
    }

  }

}

const config = JSON.parse(readFileSync('config.json').toString());

const exporter = new ShimoExporter(config);

for (const folder of config.folders) {
  exporter.downloadFolder(folder);
}
