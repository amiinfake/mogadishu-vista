-- Create storage bucket for tour images
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-images', 'tour-images', true);

-- Create RLS policies for tour images storage
CREATE POLICY "Users can upload their own tour images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tour-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own tour images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tour-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public tour images are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tour-images');

CREATE POLICY "Users can update their own tour images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tour-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own tour images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tour-images' AND auth.uid()::text = (storage.foldername(name))[1]);