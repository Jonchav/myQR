import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileImage, FileText, FileType, Image, Printer, Loader2 } from 'lucide-react';
import { downloadQRCode } from '@/lib/downloadUtils';
import { useToast } from '@/hooks/use-toast';

interface DownloadButtonProps {
  qrDataUrl: string;
  filename?: string;
  className?: string;
}

export function DownloadButton({ qrDataUrl, filename = 'qr-code', className }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = async (format: string, formatName: string) => {
    console.log('Download attempt:', { qrDataUrl, format, formatName });
    if (!qrDataUrl) {
      toast({
        title: "Error",
        description: "No hay código QR para descargar",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setDownloadingFormat(format);

    try {
      await downloadQRCode(format, qrDataUrl, filename);
      toast({
        title: "Descarga completada",
        description: `El código QR se ha descargado en formato ${formatName}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error en la descarga",
        description: `No se pudo descargar el archivo en formato ${formatName}`,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadingFormat(null);
    }
  };

  const downloadOptions = [
    {
      format: 'png',
      label: 'PNG',
      description: 'Imagen PNG (recomendado)',
      icon: <Image className="w-4 h-4" />,
    },
    {
      format: 'jpg',
      label: 'JPG',
      description: 'Imagen JPEG',
      icon: <FileImage className="w-4 h-4" />,
    },
    {
      format: 'svg',
      label: 'SVG',
      description: 'Imagen vectorial',
      icon: <FileType className="w-4 h-4" />,
    },
    {
      format: 'pdf-standard',
      label: 'PDF (Estándar)',
      description: 'Documento PDF simple',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      format: 'pdf-print',
      label: 'PDF (Impresión)',
      description: 'PDF listo para imprimir',
      icon: <Printer className="w-4 h-4" />,
    },
    {
      format: 'docx',
      label: 'DOCX',
      description: 'Documento Word',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={isDownloading || !qrDataUrl}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Formatos disponibles
        </div>
        <DropdownMenuSeparator />
        {downloadOptions.map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={() => handleDownload(option.format, option.label)}
            disabled={isDownloading}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              {downloadingFormat === option.format ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                option.icon
              )}
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}