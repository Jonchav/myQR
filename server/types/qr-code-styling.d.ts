declare module 'qr-code-styling' {
  export default class QRCodeStyling {
    constructor(options?: QRCodeStylingOptions);
    getRawData(extension?: string): Promise<Buffer>;
    update(options: QRCodeStylingOptions): void;
    append(element: HTMLElement): void;
    download(downloadOptions?: DownloadOptions): void;
  }

  export interface QRCodeStylingOptions {
    width?: number;
    height?: number;
    type?: 'svg' | 'canvas';
    data?: string;
    image?: string;
    margin?: number;
    qrOptions?: QROptions;
    imageOptions?: ImageOptions;
    dotsOptions?: DotsOptions;
    backgroundOptions?: BackgroundOptions;
    cornersSquareOptions?: CornersSquareOptions;
    cornersDotOptions?: CornersDotOptions;
  }

  export interface QROptions {
    typeNumber?: number;
    mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }

  export interface ImageOptions {
    hideBackgroundDots?: boolean;
    imageSize?: number;
    margin?: number;
    crossOrigin?: string;
  }

  export interface DotsOptions {
    color?: string;
    type?: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
    gradient?: Gradient;
  }

  export interface BackgroundOptions {
    color?: string;
    gradient?: Gradient;
  }

  export interface CornersSquareOptions {
    color?: string;
    type?: 'dot' | 'square' | 'extra-rounded' | 'classy-rounded';
    gradient?: Gradient;
  }

  export interface CornersDotOptions {
    color?: string;
    type?: 'dot' | 'square';
    gradient?: Gradient;
  }

  export interface Gradient {
    type?: 'linear' | 'radial';
    rotation?: number;
    colorStops?: ColorStop[];
  }

  export interface ColorStop {
    offset: number;
    color: string;
  }

  export interface DownloadOptions {
    name?: string;
    extension?: 'png' | 'jpeg' | 'webp' | 'svg';
  }
}