class SlidesController < ApplicationController
  before_action :set_slide, only: [:show, :edit, :update, :destroy]

  # GET /slides
  # GET /slides.json
  def index
    @slides = Slide.not_deleted.all
  end

  # GET /slides/1
  # GET /slides/1.json
  def show
    @pages = @slide.pages
  end

  # GET /slides/new
  def new
    @slide = Slide.new
  end

  # GET /slides/1/edit
  def edit
  end

  # POST /slides
  # POST /slides.json
  def create
    file_path = "/tmp/#{File.basename(slide_params[:file].tempfile.path)}"
    data = slide_params[:file].read
    File.open(file_path, 'wb') do |f|
      f.write(data)
    end
    @slide = Slide.new(title: slide_params[:title], status: :queued)

    if @slide.save
      SlideParseJob.perform_later(@slide, file_path)
      redirect_to action: :index
    end
  end

  # PATCH/PUT /slides/1
  # PATCH/PUT /slides/1.json
  def update
    respond_to do |format|
      if @slide.update(slide_params)
        format.html { redirect_to action: :index }
        format.json { render :show, status: :ok, location: @slide }
      else
        format.html { render :edit }
        format.json { render json: @slide.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /slides/1
  # DELETE /slides/1.json
  def destroy
    @slide.destroy
    respond_to do |format|
      format.html { redirect_to slides_url, notice: 'Slide was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_slide
      @slide = Slide.not_deleted.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def slide_params
      params.fetch(:slide, {}).permit(:title, :file)
    end
end
