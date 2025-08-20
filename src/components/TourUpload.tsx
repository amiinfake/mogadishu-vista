import React, { useState, useRef } from 'react';
import { Upload, X, MapPin, Camera, Globe, Video, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TourUploadProps {
  onClose: () => void;
  onTourCreated: () => void;
}

interface VideoFile {
  file: File;
  preview: string;
  duration?: number;
  size: string;
}

const TourUpload: React.FC<TourUploadProps> = ({ onClose, onTourCreated }) => {
  const { user } = useAuth();
  const [tourTitle, setTourTitle] = useState('');
  const [tourDescription, setTourDescription] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video file`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const duration = await getVideoDuration(file);
      
      const videoFile: VideoFile = {
        file,
        preview,
        duration,
        size: formatFileSize(file.size)
      };

      setVideos(prev => [...prev, videoFile]);
    }
  };

  const removeVideo = (index: number) => {
    setVideos(prev => {
      const newVideos = [...prev];
      URL.revokeObjectURL(newVideos[index].preview);
      newVideos.splice(index, 1);
      return newVideos;
    });
  };

  const uploadTour = async () => {
    if (!user || !tourTitle.trim() || videos.length === 0) {
      toast.error('Please fill in tour title and add at least one 360° video');
      return;
    }

    setIsUploading(true);
    setProcessingProgress(0);

    try {
      for (let i = 0; i < videos.length; i++) {
        const videoFile = videos[i];
        
        // Upload video to Supabase Storage
        const fileName = `${user.id}/${Date.now()}_${i}_${videoFile.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tour-images')
          .upload(fileName, videoFile.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload video ${i + 1}`);
          continue;
        }

        setProcessingProgress(25 + (i * 25));

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('tour-images')
          .getPublicUrl(fileName);

        // Create processing job entry
        const { error: dbError } = await supabase
          .from('locations')
          .insert({
            user_id: user.id,
            title: `${tourTitle} - Processing`,
            description: `360° video processing in progress - ${videoFile.size}`,
            longitude: 45.3254 + (Math.random() - 0.5) * 0.02, // Temporary coords
            latitude: 2.0469 + (Math.random() - 0.5) * 0.02,
            has_street_view: false,
            street_view_image_url: publicUrl,
            location_type: 'video_processing',
            is_public: false
          });

        if (dbError) {
          console.error('Database error:', dbError);
          toast.error(`Failed to create processing job ${i + 1}`);
        }

        // Call processing edge function
        const { error: processError } = await supabase.functions.invoke('process-360-video', {
          body: {
            videoUrl: publicUrl,
            tourTitle,
            tourDescription,
            userId: user.id
          }
        });

        if (processError) {
          console.error('Processing error:', processError);
          toast.error(`Failed to start processing for video ${i + 1}`);
        }
      }

      setProcessingProgress(100);
      toast.success(`Videos uploaded! Processing will extract panoramas and place them on the map automatically.`);
      onTourCreated();
      onClose();
      
    } catch (error) {
      console.error('Tour upload error:', error);
      toast.error('Failed to upload tour');
    } finally {
      setIsUploading(false);
      setProcessingProgress(0);
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
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload 360° Videos</h3>
                <p className="text-muted-foreground mb-4">
                  Upload 360° videos - we'll extract frames and GPS data automatically
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select Videos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Video Preview Grid */}
            {videos.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Uploaded Videos ({videos.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((video, index) => (
                    <div key={index} className="relative group border rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <video
                            src={video.preview}
                            className="w-20 h-20 object-cover rounded"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">{video.file.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {video.duration ? `${Math.round(video.duration)}s` : 'Unknown duration'} • {video.size}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            <Camera className="w-3 h-3 mr-1" />
                            360° Video
                          </Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => removeVideo(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Progress */}
            {isUploading && processingProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing videos...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={uploadTour} 
                disabled={isUploading || !tourTitle.trim() || videos.length === 0}
                className="flex-1"
              >
                {isUploading ? 'Processing...' : `Upload & Process (${videos.length} videos)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TourUpload;