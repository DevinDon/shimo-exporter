import { Logger } from '@iinfinity/logger';
import Axios, { AxiosInstance } from 'axios';
import * as download from 'download';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ShimoFile } from './@types';

export class ShimoExporter {

  static readonly url = {
    api: 'https://shimo.im/api/',
    files: 'https://shimo.im/lizard-api/files/',
    export: 'https://xxport.shimo.im/files/'
  };

  private logger: Logger = new Logger({
    name: 'shimo',
    stdout: process.stdout,
    stderr: process.stderr,
    fileout: join('log', 'shimo.log'),
    fileerr: join('log', 'shimo.error.log'),
  });
  private axios: AxiosInstance = Axios.create();

  constructor(
    private config: {
      cookie: string,
      path: string
    }
  ) {
    this.axios.interceptors.response.use(response => response.data);
  }

  test() {
    this.logger.info(1);
    this.logger.warn(2);
    this.logger.error(3);
  }

  getFiles(folder: string): Promise<ShimoFile[]> {
    return this.axios.get(
      ShimoExporter.url.files,
      {
        params: {
          collaboratorCount: true,
          folder
        },
        headers: {
          cookie: this.config.cookie,
          referer: 'https://shimo.im/folder/123123'
        }
      }
    );
  }

  async getContentURL(guid: string): Promise<string> {
    return this.axios
      .get<any, any>(
        ShimoExporter.url.files + guid,
        {
          params: { contentUrl: true },
          headers: {
            cookie: this.config.cookie,
            referer: 'https://shimo.im/folder/123123'
          }
        },
      )
      .then(data => data.contentUrl);
  }

  async getExportURL({ guid, name }: ShimoFile, type: string): Promise<string> {

    return this.axios
      .get(
        `${ShimoExporter.url.export}${guid}/export`,
        {
          params: {
            type,
            file: guid,
            returnJson: 1,
            name: encodeURIComponent(name)
          },
          headers: {
            cookie: this.config.cookie,
            referer: 'https://shimo.im/folder/123123'
          }
        }
      )
      .then((data: any) => data.redirectUrl);
  }

  async exportBoard(file: ShimoFile, dir: string) {
    this.logger.warn(`石墨白板无法导出：【${file.name}】`);
  }

  async exportForm(file: ShimoFile, dir: string) {
    this.logger.warn(`石墨表单无法导出：【${file.name}】`);
  }

  async exportMindMap(file: ShimoFile, dir: string) {
    this.logger.info(`思维导图导出中：【${file.name}】`);
    const cdn = await this.getContentURL(file.guid);
    return download(
      `${ShimoExporter.url.api}${file.type}/exports?url=${encodeURIComponent(cdn)}&format=xmind&name=${encodeURIComponent(file.name)}`,
      dir
    );
    // https://shimo.im/lizard-api/files/R13j8r1gOjUMQJk5?contentUrl=true
    // https://shimo.im/api/mindmap/exports?url=https%3A%2F%2Ffile-contents-23456789.oss-cn-beijing.aliyuncs.com%2FR13j8r1gOjUMQJk5%3FOSSAccessKeyId%3DLTAI4FoEPTasjWkqu1meFaHK%26Expires%3D1600149182%26Signature%3DXqSWO4bsREwnI0dz3OnvCxQrbaY%253D&format=xmind&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportSlide(file: ShimoFile, dir: string) {
    this.logger.info(`幻灯片导出中：【${file.name}】`);
    return download(await this.getExportURL(file, 'pptx'), dir);
    // https://xxport.shimo.im/files/wV3VVN74rZs8VJ3y/export?type=pptx&file=wV3VVN74rZs8VJ3y&returnJson=1&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportSheet(file: ShimoFile, dir: string) {
    this.logger.info(`表格导出中：【${file.name}】`);
    return download(await this.getExportURL(file, 'xlsx'), dir);
    // https://xxport.shimo.im/files/1d3aVWr6BeU8pQqg/export?type=xlsx&file=1d3aVWr6BeU8pQqg&returnJson=1&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportDoc(file: ShimoFile, dir: string) {
    this.logger.info(`Office 文档导出中：【${file.name}】`);
    return download(await this.getExportURL(file, 'docx'), dir);
    // https://xxport.shimo.im/files/loqeWmz7wYFxOyAn/export?type=docx&file=loqeWmz7wYFxOyAn&returnJson=1&name=%E6%97%A0%E6%A0%87%E9%A2%98
  }

  async exportNewDoc(file: ShimoFile, dir: string) {
    this.logger.info(`MarkDown 文档导出中：【${file.name}】`);
    return download(await this.getExportURL(file, 'md'), dir);
  }

  async exportDownload(file: ShimoFile, dir: string) {
    this.logger.info(`原始类型文档下载中：【${file.name}】`);
    return download(file.downloadUrl, dir, {
      headers: {
        cookie: this.config.cookie,
        referer: 'https://shimo.im/folder/123123'
      }
    });
  }

  async exportUnknown(file: ShimoFile, dir: string) {
    this.logger.info(`未知类型文档下载中：【${file.name}】`);
    return download(file.downloadUrl, dir, {
      headers: {
        cookie: this.config.cookie,
        referer: 'https://shimo.im/folder/123123'
      }
    });
    // .replace(/[\'\"\\\/\b\f\n\r\t]/g, '_')
  }

  async downloadFolder(folder: string, dir: string = this.config.path) {
    const list: ShimoFile[] = await this.getFiles(folder);
    for (const file of list) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        if (file.isFolder) {
          this.downloadFolder(file.guid, join(dir, file.name));
        } else {
          this.downloadFile(file, dir);
        }
      } catch (error) {
        this.logger.error(`文档导出失败：【${file.name}】`);
      }
    }
  }

  async downloadFile(file: ShimoFile, dir: string) {
    switch (file.type) {
      case 'board':
        await this.exportBoard(file, dir);
        break;
      case 'form':
        await this.exportForm(file, dir);
        break;
      case 'mindmap':
        await this.exportMindMap(file, dir);
        break;
      case 'slide':
        await this.exportSlide(file, dir);
        break;
      case 'mosheet':
        await this.exportSheet(file, dir);
        break;
      case 'modoc':
        await this.exportDoc(file, dir);
        break;
      case 'newdoc':
        await this.exportNewDoc(file, dir);
        break;
      case 'xls':
        await this.exportDownload(file, dir);
        break;
      default:
        await this.exportUnknown(file, dir);
        break;
    }
  }

}

const config = JSON.parse(readFileSync('config.json').toString());

const exporter = new ShimoExporter(config);

exporter.downloadFolder(config.folder);
