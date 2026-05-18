import { Component, OnInit, inject, viewChild, TemplateRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, Play, Edit, Trash2, Bot, Mic, Mail } from 'lucide-angular';
import Swal from 'sweetalert2';
import { IaResponseService } from '../../core/services/ia-response.service';
import { ApiResponse } from '../../core/models/ia-response';
import { SoundRequest } from '../../core/models/dto/sound-request';

@Component({
  selector: 'app-ia-crud',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatDialogModule,
    LucideAngularModule
  ],
  templateUrl: './ia-crud.html',
  styleUrls: ['./ia-crud.scss']
})
export class IaCrudComponent implements OnInit {
  private iaService = inject(IaResponseService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Estado manejado con Signals nativos (Angular 21)
  responses = signal<ApiResponse[]>([]);
  editingId = signal<string | null>(null);
  displayedColumns: string[] = ['apiName', 'prompt', 'timestamp', 'acciones'];
  
  elevenLabsForm = this.fb.nonNullable.group({
    prompt: ['', Validators.required],
    durationSeconds: [5, [Validators.required, Validators.min(1)]],
    promptInfluence: [0.5, [Validators.required, Validators.min(0), Validators.max(1)]]
  });

  zeroBounceForm = this.fb.nonNullable.group({
    prompt: ['', [Validators.required, Validators.email]]
  });

  // Queries basadas en Signals en vez de @ViewChild heredado
  elevenLabsModal = viewChild.required<TemplateRef<any>>('elevenLabsModal');
  zeroBounceModal = viewChild.required<TemplateRef<any>>('zeroBounceModal');

  // Iconos
  readonly Play = Play;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Bot = Bot;
  readonly Mic = Mic;
  readonly Mail = Mail;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.iaService.getResponses().subscribe(data => {
      this.responses.set(data);
    });
  }

  // --- Funciones para abrir Modales ---
  openElevenLabsDialog() {
    this.editingId.set(null);
    this.elevenLabsForm.reset({ durationSeconds: 5, promptInfluence: 0.5 });
    this.dialog.open(this.elevenLabsModal(), { width: '500px' });
  }

  openZeroBounceDialog() {
    this.editingId.set(null);
    this.zeroBounceForm.reset();
    this.dialog.open(this.zeroBounceModal(), { width: '400px' });
  }

  // --- Procesar Formularios ---
  onSubmitElevenLabs() {
    if (this.elevenLabsForm.invalid) return;
    this.dialog.closeAll();
    
    const soundReq: SoundRequest = {
      prompt: this.elevenLabsForm.getRawValue().prompt,
      durationSeconds: this.elevenLabsForm.getRawValue().durationSeconds,
      promptInfluence: this.elevenLabsForm.getRawValue().promptInfluence
    };
    
    this.processRequest(soundReq, 'ElevenLabs');
  }

  onSubmitZeroBounce() {
    if (this.zeroBounceForm.invalid) return;
    this.dialog.closeAll();

    const request = {
      prompt: this.zeroBounceForm.getRawValue().prompt,
      durationSeconds: 0, 
      promptInfluence: 0 
    };

    this.processRequest(request, 'ZeroBounce');
  }

  // --- Lógica del Backend ---
  private processRequest(reqData: any, apiName: string) {
    Swal.fire({
      title: 'Procesando...',
      text: `Conectando con ${apiName}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const currentId = this.editingId();

    if (currentId) {
      this.iaService.updateRequest(currentId, reqData).subscribe({
        next: () => this.onSuccess('Consulta actualizada correctamente'),
        error: () => Swal.fire('Error', 'Fallo al actualizar', 'error')
      });
    } else {
      this.iaService.createRequest(reqData, apiName).subscribe({
        next: () => this.onSuccess('Consulta procesada y guardada'),
        error: () => Swal.fire('Error', 'Fallo en la conexión API', 'error')
      });
    }
  }

  onSuccess(msg: string) {
    Swal.fire('¡Éxito!', msg, 'success');
    this.loadData();
  }

  deleteResponse(id: string) {
    Swal.fire({
      title: '¿Eliminar registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.iaService.deleteResponse(id).subscribe(() => {
          Swal.fire('Eliminado', 'Registro borrado.', 'success');
          this.loadData();
        });
      }
    });
  }

  playAudio(response: ApiResponse) {
    if (response.audioData) {
      this.iaService.playBase64Audio(response.audioData);
    } else {
      Swal.fire('Sin Audio', 'Este registro no contiene datos de audio.', 'info');
    }
  }

  editResponse(response: ApiResponse) {
    this.editingId.set(response.id!);
    if (response.apiName === 'ElevenLabs') {
      this.elevenLabsForm.patchValue({
        prompt: response.requestData,
        durationSeconds: 5,
        promptInfluence: 0.5
      });
      this.dialog.open(this.elevenLabsModal(), { width: '500px' });
    } else {
      this.zeroBounceForm.patchValue({
        prompt: response.requestData
      });
      this.dialog.open(this.zeroBounceModal(), { width: '400px' });
    }
  }
}