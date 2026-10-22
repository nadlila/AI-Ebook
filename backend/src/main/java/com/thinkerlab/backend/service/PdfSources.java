package com.thinkerlab.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

/** Extract all pages without silently truncating source content. */
public final class PdfSources {
  private PdfSources() {}
  public record Extracted(String text, String fileName, int pages) {}
  public static Extracted extract(MultipartFile file) {
    if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024)
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "PDF harus berukuran maksimal 10 MB dan tidak kosong.");
    try {
      byte[] bytes = file.getBytes();
      if (bytes.length < 5 || !new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-"))
        throw ProjectService.error(HttpStatus.BAD_REQUEST, "File harus berupa PDF yang valid.");
      try (var document = Loader.loadPDF(bytes)) {
        if (document.isEncrypted() || !document.getCurrentAccessPermission().canExtractContent())
          throw ProjectService.error(HttpStatus.BAD_REQUEST, "PDF terkunci atau tidak mengizinkan ekstraksi teks.");
        int pages = document.getNumberOfPages();
        if (pages == 0 || pages > 300)
          throw ProjectService.error(HttpStatus.BAD_REQUEST, "PDF harus memiliki 1 sampai 300 halaman.");
        var stripper = new PDFTextStripper();
        var text = new StringBuilder();
        for (int page = 1; page <= pages; page++) {
          stripper.setStartPage(page);
          stripper.setEndPage(page);
          String content = stripper.getText(document).replace(String.valueOf((char) 0), "").strip();
          if (content.isBlank())
            throw ProjectService.error(HttpStatus.BAD_REQUEST,
                "Halaman " + page + " tidak memiliki teks terbaca. Lakukan OCR atau hapus halaman kosong sebelum upload.");
          text.append("[Halaman ").append(page).append("]\n").append(content).append("\n\n");
          if (text.length() > 500000)
            throw ProjectService.error(HttpStatus.BAD_REQUEST, "Isi PDF melebihi 500.000 karakter. Pisahkan dokumen terlebih dahulu.");
        }
        String name = file.getOriginalFilename();
        name = name == null ? "sumber.pdf" : name.replace((char) 92, '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        if (name.length() > 255) name = name.substring(name.length() - 255);
        return new Extracted(text.toString(), name, pages);
      }
    } catch (IOException | IllegalArgumentException e) {
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "PDF rusak atau terkunci. Upload PDF yang dapat dibaca tanpa password.");
    }
  }
}
