-- Create locations table for storing map points and street view data
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  longitude DECIMAL(10, 7) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  has_street_view BOOLEAN DEFAULT false,
  street_view_image_url TEXT,
  location_type TEXT DEFAULT 'marker', -- marker, route, area
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for location access
CREATE POLICY "Public locations are viewable by everyone" 
ON public.locations 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own locations" 
ON public.locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" 
ON public.locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" 
ON public.locations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" 
ON public.locations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default public locations for Mogadishu
INSERT INTO public.locations (title, description, longitude, latitude, has_street_view, is_public, location_type) VALUES
('Bakaara Market', 'Main commercial district', 45.3254, 2.0469, true, true, 'marker'),
('Aden Adde International Airport', 'Main airport terminal', 45.3431, 2.0469, true, true, 'marker'),
('Villa Somalia', 'Presidential palace', 45.3311, 2.0394, true, true, 'marker'),
('Liido Beach', 'Popular beach area', 45.3200, 2.0500, true, true, 'marker'),
('Mogadishu Port', 'Main seaport', 45.3180, 2.0450, true, true, 'marker'),
('Banadir Hospital', 'Main hospital', 45.3350, 2.0380, true, true, 'marker'),
('Central Mosque', 'Historic mosque', 45.3280, 2.0420, true, true, 'marker'),
('Fish Market', 'Local fish market', 45.3150, 2.0480, true, true, 'marker');