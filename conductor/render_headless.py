import os
import subprocess
import wave
import contextlib
import sys
import shutil

def render_story(factory, scene_id, **kwargs):
    print(f"🎬 Iniciando Renderização Headless para {factory} / {scene_id}...")
    
    # 1. Definir caminhos
    wav_path = f"pipeline/sync_drive/audio_ready/{factory}/{scene_id}/{scene_id}.wav"
    output_dir = "pipeline/sync_drive/exports"
    os.makedirs(output_dir, exist_ok=True)
    output_path = f"{output_dir}/{factory}_{scene_id}.mp4"

    if not os.path.exists(wav_path):
        print(f"❌ Erro: Áudio não encontrado em {wav_path}")
        return False

    # 2. Obter duração do áudio
    with contextlib.closing(wave.open(wav_path, 'r')) as f:
        frames = f.getnframes()
        rate = f.getframerate()
        duration = frames / float(rate)
    
    # Adicionar uma pequena folga de segurança na duração
    duration_rounded = round(duration + 0.2, 2)
    print(f"⏱️ Duração do áudio detectada: {duration_rounded}s")

    # 5. Compilar os assets web
    print("📦 Compilando assets do projeto (npm run build)...")
    subprocess.run(["npm", "run", "build"], check=True)

    # 6. Executar o script headless customizado que ja vem no repositorio
    print("🎥 Executando script headless customizado...")
    recorder_path = os.path.abspath("scripts/headless_record.js")

    print("🚀 Iniciando preview server e depois o headless record")

    # Start preview server in the background
    preview_process = subprocess.Popen(["npm", "run", "preview"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    import time
    time.sleep(2) # wait for server to start

    try:
        # Executar gravador
        subprocess.run(["node", recorder_path], check=True)
        print(f"🎉 Sucesso! Vídeo (screenshot para demonstração) gravado e salvo em: exports/")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error during execution, checking the headless_record.js.")
        raise e
    finally:
        preview_process.kill()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python render_headless.py <factory> <scene_id>")
        sys.exit(1)
    
    factory = sys.argv[1]
    scene_id = sys.argv[2]
    render_story(factory, scene_id)
