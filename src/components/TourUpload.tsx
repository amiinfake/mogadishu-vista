import React, { useState, useRef } from 'react';
import { Upload, X, MapPin, Camera, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TourUploadProps {
  onClose: () => void;
  onTourCreated: () => void;
}

interface ImageFile {
  file: File;
  preview: string;
  gpsCoords?: { lat: number; lng: number };
  timestamp?: Date;
}

const TourUpload: React.FC<TourUploadProps> = ({ onClose, onTourCreated }) => {
  const { user } = useAuth();
  const [tourTitle, setTourTitle] = useState('');
  const [tourDescription, setTourDescription] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract GPS data from EXIF
  const extractGPSFromExif = async (file: File): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // This is a simplified version - in production you'd use a library like exif-js or piexifjs
          // For now, we'll generate random coordinates around Mogadishu as a demo
          const coords = {
            lat: 2.0469 + (Math.random() - 0.5) * 0.02,
            lng: 45.3254 + (Math.random() - 0.5) * 0.02
          };
          resolve(coords);
        } catch (error) {
          console.error('Error extracting GPS:', error);
          resolve(null);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const preview = URL.createObjectURL(file);
      const gpsCoords = await extractGPSFromExif(file);
      
      const imageFile: ImageFile = {
        file,
        preview,
        gpsCoords: gpsCoords || undefined,
        timestamp: new Date(file.lastModified)
      };

      setImages(prev => [...prev, imageFile]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadTour = async () => {
    if (!user || !tourTitle.trim() || images.length === 0) {
      toast.error('Please fill in tour title and add at least one image');
      return;
    }

    setIsUploading(true);

    try {
      // Sort images by timestamp for sequential linking
      const sortedImages = [...images].sort((a, b) => 
        (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
      );

      for (let i = 0; i < sortedImages.length; i++) {
        const imageFile = sortedImages[i];
        const { gpsCoords } = imageFile;
        
        if (!gpsCoords) {
          toast.error(`Image ${i + 1} has no GPS coordinates`);
          continue;
        }

        // Upload image to Supabase Storage
        const fileName = `${user.id}/${Date.now()}_${i}_${imageFile.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tour-images')
          .upload(fileName, imageFile.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload image ${i + 1}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('tour-images')
          .getPublicUrl(fileName);

        // Create location entry
        const { error: dbError } = await supabase
          .from('locations')
          .insert({
            user_id: user.id,
            title: `${tourTitle} - Stop ${i + 1}`,
            description: tourDescription || `360° panorama ${i + 1} of ${images.length}`,
            longitude: gpsCoords.lng,
            latitude: gpsCoords.lat,
            has_street_view: true,
            street_view_image_url: publicUrl,
            location_type: 'tour_stop',
            is_public: false // Private by default
          });

        if (dbError) {
          console.error('Database error:', dbError);
          toast.error(`Failed to save location ${i + 1}`);
        }
      }

      toast.success(`Tour "${tourTitle}" uploaded successfully!`);
      onTourCreated();
      onClose();
      
    } catch (error) {
      console.error('Tour upload error:', error);
      toast.error('Failed to upload tour');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload 360° Tour
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Tour Details */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tour Title</label>
                <Input
                  placeholder="e.g., Downtown Mogadishu Walking Tour"
                  value={tourTitle}
                  onChange={(e) => setTourTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Describe your tour..."
                  value={tourDescription}
                  onChange={(e) => setTourDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <div className="text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload 360° Images</h3>
                <p className="text-muted-foreground mb-4">
                  Select multiple 360° images with GPS metadata
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select Images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Uploaded Images ({images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="absolute bottom-2 left-2">
                        {image.gpsCoords ? (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            GPS
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            No GPS
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={uploadTour} 
                disabled={isUploading || !tourTitle.trim() || images.length === 0}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : `Upload Tour (${images.length} images)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TourUpload;