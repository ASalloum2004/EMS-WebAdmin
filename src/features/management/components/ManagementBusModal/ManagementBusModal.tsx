import { useMemo, useState, type FormEvent } from "react";
import {
  ModalCloseButton,
  SearchFilterBar,
  TableFooter,
} from "../../../../components";
import { useI18n } from "../../../../i18n";
import { useBuses } from "../../hooks";
import type { BusApiData } from "../../types";
import { BusesTableSkeleton } from "../skeletons";
import "../ManagementServicesModal/ManagementServicesModal.scss";
import "./ManagementBusModal.scss";

const BUSES_PER_PAGE = 3;

interface ManagementBusModalProps {
  onClose: () => void;
}

export function ManagementBusModal({ onClose }: ManagementBusModalProps) {
  const { t } = useI18n();
  const [busPendingDeletion, setBusPendingDeletion] =
    useState<BusApiData | null>(null);
  const validationMessages = useMemo(
    () => ({
      durationRequired: t.management.busModal.durationRequired,
      endTimeRequired: t.management.busModal.endTimeRequired,
      invalidDuration: t.management.busModal.invalidDuration,
      invalidTime: t.management.busModal.invalidTime,
      locationRequired: t.management.busModal.locationRequired,
      locationTooLong: t.management.busModal.locationTooLong,
      startTimeRequired: t.management.busModal.startTimeRequired,
    }),
    [
      t.management.busModal.durationRequired,
      t.management.busModal.endTimeRequired,
      t.management.busModal.invalidDuration,
      t.management.busModal.invalidTime,
      t.management.busModal.locationRequired,
      t.management.busModal.locationTooLong,
      t.management.busModal.startTimeRequired,
    ],
  );
  const {
    buses,
    isLoading,
    isRefreshing,
    error,
    refetch,
    currentPage,
    setCurrentPage,
    perPage,
    totalItems,
    totalPages,
    searchLocation,
    setSearchLocation,
    busForm,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    isSubmitting,
    isSaveDisabled,
    formStatusMessage,
    isDeleting,
    deleteError,
    deleteBusById,
    clearErrors,
  } = useBuses({
    enabled: true,
    initialPerPage: BUSES_PER_PAGE,
    validationMessages,
  });
  const formTitle =
    busForm.mode === "edit"
      ? t.management.busModal.editTitle
      : t.management.busModal.addTitle;
  const isBusListLoading = isLoading || isRefreshing;

  function handleSearchChange(value: string) {
    setSearchLocation(value);
  }

  function handleOpenDelete(bus: BusApiData) {
    clearErrors();
    setBusPendingDeletion(bus);
  }

  function handleCloseDelete() {
    if (!isDeleting) {
      setBusPendingDeletion(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaveDisabled) {
      return;
    }

    await submitForm();
  }

  async function handleDelete() {
    if (!busPendingDeletion || isDeleting) {
      return;
    }

    const wasDeleted = await deleteBusById(busPendingDeletion.id);

    if (wasDeleted) {
      setBusPendingDeletion(null);
    }
  }

  return (
    <div className="management-services-modal" role="presentation">
      <div
        className="management-services-modal__backdrop"
        onClick={onClose}
      />

      <section
        aria-busy={isBusListLoading}
        className="management-services-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-bus-title"
        aria-describedby="management-bus-description"
      >
        <header className="management-services-modal__header">
          <div className="management-services-modal__copy">
            <h2 id="management-bus-title">{t.management.busModal.title}</h2>
            <p id="management-bus-description">
              {t.management.busModal.description}
            </p>
          </div>

          <ModalCloseButton ariaLabel={t.common.close} onClick={onClose} />
        </header>

        <div className="management-services-modal__toolbar">
          <SearchFilterBar
            className="management-services-modal__search"
            value={searchLocation}
            onChange={handleSearchChange}
            placeholder={t.management.busModal.searchPlaceholder}
            inputAriaLabel={t.management.busModal.searchAriaLabel}
            showFilterButton={false}
          />

          <button
            className="management-services-modal__add-button"
            type="button"
            onClick={openCreate}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M10 3.25c.41 0 .75.34.75.75v5.25H16a.75.75 0 0 1 0 1.5h-5.25V16a.75.75 0 0 1-1.5 0v-5.25H4a.75.75 0 0 1 0-1.5h5.25V4c0-.41.34-.75.75-.75Z" />
            </svg>
            <span>{t.management.busModal.addBus}</span>
          </button>
        </div>

        {busForm.isOpen ? (
          <form
            className="management-services-modal__form"
            aria-label={formTitle}
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="management-services-modal__form-header">
              <h3>{formTitle}</h3>
            </div>

            <div className="management-services-modal__form-grid management-services-modal__form-grid--bus">
              <label className="management-services-modal__field">
                <span>{t.management.busModal.location}</span>
                <input
                  type="text"
                  maxLength={255}
                  value={busForm.values.location}
                  onChange={(event) =>
                    busForm.updateField("location", event.target.value)
                  }
                />
              </label>

              <label className="management-services-modal__field">
                <span>{t.management.busModal.startTime}</span>
                <input
                  type="time"
                  step="1"
                  value={busForm.values.startTime}
                  onChange={(event) =>
                    busForm.updateField("startTime", event.target.value)
                  }
                />
              </label>

              <label className="management-services-modal__field">
                <span>{t.management.busModal.endTime}</span>
                <input
                  type="time"
                  step="1"
                  value={busForm.values.endTime}
                  onChange={(event) =>
                    busForm.updateField("endTime", event.target.value)
                  }
                />
              </label>

              <label className="management-services-modal__field">
                <span>{t.management.busModal.duration}</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={busForm.values.duration}
                  onChange={(event) =>
                    busForm.updateField("duration", event.target.value)
                  }
                />
              </label>
            </div>

            {formStatusMessage ? (
              <p
                className="management-services-modal__form-message"
                role="alert"
              >
                {formStatusMessage}
              </p>
            ) : null}

            <div className="management-services-modal__form-actions">
              <button
                className="management-services-modal__button management-services-modal__button--secondary"
                type="button"
                disabled={isSubmitting}
                onClick={closeForm}
              >
                {t.common.cancel}
              </button>
              <button
                className="management-services-modal__button management-services-modal__button--primary"
                type="submit"
                disabled={isSaveDisabled}
              >
                {isSubmitting ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        ) : null}

        {isBusListLoading ? (
          <BusesTableSkeleton />
        ) : !error ? (
          <>
            {buses.length ? (
              <>
                <div
                  className="management-services-modal__table management-services-modal__table--bus"
                  role="table"
                  aria-label={t.management.busModal.title}
                >
                  <div
                    className="management-services-modal__table-head"
                    role="rowgroup"
                  >
                    <div className="management-services-modal__row" role="row">
                      <div role="columnheader">
                        {t.management.busModal.location}
                      </div>
                      <div role="columnheader">
                        {t.management.busModal.startTime}
                      </div>
                      <div role="columnheader">
                        {t.management.busModal.endTime}
                      </div>
                      <div role="columnheader">
                        {t.management.busModal.duration}
                      </div>
                      <div role="columnheader">
                        {t.management.busModal.actions}
                      </div>
                    </div>
                  </div>

                  <div
                    className="management-services-modal__table-body"
                    role="rowgroup"
                  >
                    {buses.map((bus) => (
                      <div
                        className="management-services-modal__row"
                        role="row"
                        key={bus.id}
                      >
                        <div
                          className="management-services-modal__cell management-services-modal__cell--primary"
                          role="cell"
                          data-label={t.management.busModal.location}
                        >
                          {bus.location}
                        </div>
                        <div
                          className="management-services-modal__cell"
                          role="cell"
                          data-label={t.management.busModal.startTime}
                        >
                          {bus.start_time}
                        </div>
                        <div
                          className="management-services-modal__cell"
                          role="cell"
                          data-label={t.management.busModal.endTime}
                        >
                          {bus.end_time}
                        </div>
                        <div
                          className="management-services-modal__cell"
                          role="cell"
                          data-label={t.management.busModal.duration}
                        >
                          {bus.duration}
                        </div>
                        <div
                          className="management-services-modal__cell management-services-modal__cell--action"
                          role="cell"
                          data-label={t.management.busModal.actions}
                        >
                          <button
                            className="management-services-modal__edit-button"
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => openEdit(bus)}
                          >
                            {t.common.edit}
                          </button>
                          <button
                            className="management-services-modal__delete-button"
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleOpenDelete(bus)}
                          >
                            {t.management.busModal.delete}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <TableFooter
                  currentPage={currentPage}
                  perPage={perPage}
                  totalItems={totalItems}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <p className="management-services-modal__empty">
                {t.management.busModal.empty}
              </p>
            )}
          </>
        ) : (
          <div className="management-services-modal__empty" role="alert">
            <p>{error || t.management.busModal.loadError}</p>
            <button type="button" onClick={() => void refetch()}>
              {t.common.tryAgain}
            </button>
          </div>
        )}
      </section>

      {busPendingDeletion ? (
        <div className="management-bus-delete-dialog" role="presentation">
          <div
            className="management-bus-delete-dialog__backdrop"
            onClick={handleCloseDelete}
          />
          <section
            className="management-bus-delete-dialog__panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="management-bus-delete-title"
            aria-describedby="management-bus-delete-message"
          >
            <h3 id="management-bus-delete-title">
              {t.management.busModal.deleteTitle}
            </h3>
            <p id="management-bus-delete-message">
              {t.management.busModal.deleteMessage.replace(
                "{{location}}",
                busPendingDeletion.location,
              )}
            </p>

            {deleteError ? (
              <p className="management-bus-delete-dialog__error" role="alert">
                {deleteError}
              </p>
            ) : null}

            <div className="management-bus-delete-dialog__actions">
              <button
                className="management-services-modal__button management-services-modal__button--secondary"
                type="button"
                disabled={isDeleting}
                onClick={handleCloseDelete}
              >
                {t.common.cancel}
              </button>
              <button
                className="management-bus-delete-dialog__confirm"
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting
                  ? t.management.busModal.deleting
                  : t.management.busModal.delete}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
