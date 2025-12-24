import { supabaseAdmin } from "../config/supabase.js";

/**
 * Upload audio file to Supabase Storage
 */
export const uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided.",
      });
    }

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
    const filePath = `audio/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("audio-files")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("audio-files")
      .getPublicUrl(filePath);

    res.status(201).json({
      success: true,
      message: "Audio uploaded successfully.",
      data: {
        path: data.path,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload cover image to Supabase Storage
 */
export const uploadCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
    const filePath = `covers/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("covers")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("covers")
      .getPublicUrl(filePath);

    res.status(201).json({
      success: true,
      message: "Cover uploaded successfully.",
      data: {
        path: data.path,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
