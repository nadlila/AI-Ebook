package com.thinkerlab.backend.service;

import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

/** Decode and re-encode uploads; filenames and client MIME types are not trusted. */
public final class CoverImages {
  private CoverImages() {}

  public static String encode(MultipartFile file) {
    if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024)
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "Pilih gambar JPG/PNG maksimal 2 MB.");
    try (var stream = ImageIO.createImageInputStream(file.getInputStream())) {
      var readers = ImageIO.getImageReaders(stream);
      if (!readers.hasNext()) throw new IOException();
      var reader = readers.next();
      try {
        String format = reader.getFormatName();
        if (!format.equalsIgnoreCase("png") && !format.equalsIgnoreCase("jpeg")) throw new IOException();
        reader.setInput(stream);
        int width = reader.getWidth(0), height = reader.getHeight(0);
        if (width < 1 || height < 1 || (long) width * height > 16_000_000) throw new IOException();
        var original = reader.read(0);
        double scale = Math.min(1.0, Math.min(480.0 / width, 720.0 / height));
        var resized = new BufferedImage(Math.max(1, (int)(width * scale)),
            Math.max(1, (int)(height * scale)), BufferedImage.TYPE_INT_RGB);
        var graphics = resized.createGraphics();
        try {
          graphics.setColor(Color.WHITE);
          graphics.fillRect(0, 0, resized.getWidth(), resized.getHeight());
          graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
          graphics.drawImage(original, 0, 0, resized.getWidth(), resized.getHeight(), null);
        } finally { graphics.dispose(); }
        var output = new ByteArrayOutputStream();
        if (!ImageIO.write(resized, "jpeg", output) || output.size() > 250_000) throw new IOException();
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
      } finally { reader.dispose(); }
    } catch (IOException | RuntimeException ex) {
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "Gambar tidak valid atau terlalu besar. Gunakan JPG/PNG maksimal 16 megapiksel.");
    }
  }
}
