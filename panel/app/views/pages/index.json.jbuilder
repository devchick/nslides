json.pages @pages do |page|
  json.extract! page, :id, :num, :slide_id, :image_src, :width, :height
end
gg
